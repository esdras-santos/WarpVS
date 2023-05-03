"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiEncodePacked = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../warplib/utils");
const base_1 = require("../base");
const base_2 = require("./base");
const importPaths_1 = require("../../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
/**
 * Given any data type produces the same output of solidity abi.encodePacked
 * in the form of an array of felts where each element represents a byte
 */
class AbiEncodePacked extends base_2.AbiBase {
    constructor(memoryRead, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.functionName = 'abi_encode_packed';
        this.memoryRead = memoryRead;
    }
    getOrCreate(types) {
        const [params, encodings, functionsCalled] = types.reduce(([params, encodings, functionsCalled], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            const [paramEncoding, paramFuncCalls] = this.generateEncodingCode(type, 'bytes_index', `param${index}`);
            encodings.push(paramEncoding);
            return [params, encodings, functionsCalled.concat(paramFuncCalls)];
        }, [
            new Array(),
            new Array(),
            new Array(),
        ]);
        const cairoParams = params.map((p) => `${p.name} : ${p.type}`).join(', ');
        const funcName = `${this.functionName}${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}(${cairoParams}) -> (result_ptr : felt){
        alloc_locals;
        let bytes_index : felt = 0;
        let (bytes_array : felt*) = alloc();
        ${encodings.join('\n')}
        let (max_length256) = felt_to_uint256(bytes_index);
        let (mem_ptr) = wm_new(max_length256, ${(0, utils_1.uint256)(1)});
        felt_array_to_warp_memory_array(0, bytes_array, 0, mem_ptr, bytes_index);
        return (mem_ptr,);
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.ALLOC),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.WM_NEW),
            this.requireImport(...importPaths_1.FELT_ARRAY_TO_WARP_MEMORY_ARRAY),
        ];
        return {
            name: funcName,
            code: code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
    }
    getOrCreateEncoding(type) {
        const unexpectedType = () => {
            throw new errors_1.TranspileFailedError(`Encoding ${(0, astPrinter_1.printTypeNode)(type)} is not supported`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createArrayInlineEncoding(type), (type) => this.createArrayInlineEncoding(type), unexpectedType, unexpectedType, (type) => this.createValueTypeHeadEncoding((0, nodeTypeProcessing_1.getPackedByteSize)(type, this.ast.inference)));
    }
    generateEncodingCode(type, newIndexVar, varToEncode) {
        // Cairo address are 251 bits in size but solidity is 160.
        // It was decided to store them fully before just a part
        if ((0, nodeTypeProcessing_1.isAddressType)(type)) {
            return [
                (0, endent_1.default) `
          let (${varToEncode}256) = felt_to_uint256(${varToEncode});
          fixed_bytes256_to_felt_dynamic_array(bytes_index, bytes_array, 0, ${varToEncode}256);
          let ${newIndexVar} = bytes_index +  32;
        `,
                [
                    this.requireImport(...importPaths_1.FELT_TO_UINT256),
                    this.requireImport(...importPaths_1.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY),
                ],
            ];
        }
        const func = this.getOrCreateEncoding(type);
        if ((0, nodeTypeProcessing_1.isDynamicArray)(type)) {
            return [
                (0, endent_1.default) `
          let (length256) = wm_dyn_array_length(${varToEncode});
          let (length) = narrow_safe(length256);
          let (${newIndexVar}) = ${func.name}(bytes_index, bytes_array, 0, length, ${varToEncode});
        `,
                [this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH), this.requireImport(...importPaths_1.NARROW_SAFE), func],
            ];
        }
        // Type is a static array
        if (type instanceof solc_typed_ast_1.ArrayType) {
            return [
                `let (${newIndexVar}) = ${func.name}(bytes_index, bytes_array, 0, ${type.size}, ${varToEncode});`,
                [func],
            ];
        }
        // Type is value type
        const packedByteSize = (0, nodeTypeProcessing_1.getPackedByteSize)(type, this.ast.inference);
        const args = ['bytes_index', 'bytes_array', '0', varToEncode];
        if (packedByteSize < 32)
            args.push(`${packedByteSize}`);
        return [
            (0, endent_1.default) `
        ${func.name}(${args.join(',')});
        let ${newIndexVar} = bytes_index +  ${packedByteSize};
      `,
            [func],
        ];
    }
    /*
     * Produce inline array encoding for static and dynamic array types
     */
    createArrayInlineEncoding(type) {
        const key = type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const cairoElementT = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        // Obtaining the location differs from static and dynamic arrays
        const elementTSize256 = (0, utils_1.uint256)(cairoElementT.width);
        const getElemLoc = (0, nodeTypeProcessing_1.isDynamicArray)(type)
            ? (0, endent_1.default) `
          let (mem_index256) = felt_to_uint256(mem_index);
          let (elem_loc : felt) = wm_index_dyn(mem_ptr, mem_index256, ${elementTSize256});
        `
            : `let elem_loc : felt = mem_ptr + ${(0, base_1.mul)('mem_index', cairoElementT.width)};`;
        const readFunc = this.memoryRead.getOrCreateFuncDef(elementT);
        const readCode = `let (elem) = ${readFunc.name}(elem_loc);`;
        const [encodingCode, funcCalls] = this.generateEncodingCode(elementT, 'new_bytes_index', 'elem');
        const name = `${this.functionName}_inline_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_array : felt*,
        mem_index : felt,
        mem_length : felt,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt){
        alloc_locals;
        if (mem_index == mem_length){
           return (final_bytes_index=bytes_index);
        }
        ${getElemLoc}
        ${readCode}
        ${encodingCode}
        return ${name}(
           new_bytes_index,
           bytes_array,
           mem_index + 1,
           mem_length,
           mem_ptr
        );
      }
      `;
        const importedFuncs = (0, nodeTypeProcessing_1.isDynamicArray)(type)
            ? [this.requireImport(...importPaths_1.WM_INDEX_DYN), this.requireImport(...importPaths_1.FELT_TO_UINT256)]
            : [];
        const genFuncInfo = { name, code, functionsCalled: [...importedFuncs, ...funcCalls, readFunc] };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createValueTypeHeadEncoding(size) {
        const funcName = size === 32 ? 'fixed_bytes256_to_felt_dynamic_array' : `fixed_bytes_to_felt_dynamic_array`;
        return this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
    }
}
exports.AbiEncodePacked = AbiEncodePacked;
//# sourceMappingURL=abiEncodePacked.js.map