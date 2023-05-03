"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexEncode = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../warplib/utils");
const base_1 = require("../base");
const base_2 = require("./base");
/**
 * It is a special class used for encoding of indexed arguments in events.
 * More info at:
   https://docs.soliditylang.org/en/v0.8.14/abi-spec.html#encoding-of-indexed-event-parameters
 */
class IndexEncode extends base_2.AbiBase {
    constructor(memoryRead, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.functionName = 'index_encode';
        this.memoryRead = memoryRead;
    }
    getOrCreate(types) {
        const [params, encodings, functionsCalled] = types.reduce(([params, encodings, functionsCalled], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            const [paramEncoding, paramFuncCalls] = this.generateEncodingCode(type, 'bytes_index', `param${index}`, false);
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
            this.requireImport(...importPaths_1.ALLOC),
            this.requireImport(...importPaths_1.BITWISE_BUILTIN),
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.WM_NEW),
            this.requireImport(...importPaths_1.FELT_ARRAY_TO_WARP_MEMORY_ARRAY),
        ];
        const cairoFunc = {
            name: funcName,
            code: code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
        return cairoFunc;
    }
    /**
     * Given a type generate a function that abi-encodes it
     * @param type type to encode
     * @returns the name of the generated function
     */
    getOrCreateEncoding(type, padding = true) {
        const unexpectedType = () => {
            throw new errors_1.TranspileFailedError(`Encoding ${(0, astPrinter_1.printTypeNode)(type)} is not supported yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => type instanceof solc_typed_ast_1.ArrayType
            ? this.createDynamicArrayHeadEncoding(type)
            : padding
                ? this.createStringOrBytesHeadEncoding()
                : this.createStringOrBytesHeadEncodingWithoutPadding(), (type) => (0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference)
            ? this.createStaticArrayHeadEncoding(type)
            : this.createArrayInlineEncoding(type), (type, def) => (0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference)
            ? this.createStructHeadEncoding(type, def)
            : this.createStructInlineEncoding(type, def), unexpectedType, () => this.createValueTypeHeadEncoding());
    }
    /**
     * Given a type it generates the function to encodes it, as well as all other
     * instructions required to use it.
     * @param type type to encode
     * @param newIndexVar cairo var where the updated index should be stored
     * @param varToEncode variable that holds the values to encode
     * @returns instructions to encode `varToEncode`
     */
    generateEncodingCode(type, newIndexVar, varToEncode, padding = true) {
        const func = this.getOrCreateEncoding(type, padding);
        if ((0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference) || (0, nodeTypeProcessing_1.isStruct)(type)) {
            return [
                (0, endent_1.default) `
          let (${newIndexVar}) = ${func.name}(
            bytes_index,
            bytes_array,
            ${varToEncode}
          );
        `,
                [func],
            ];
        }
        // Static array with known compile time size
        if (type instanceof solc_typed_ast_1.ArrayType) {
            (0, assert_1.default)(type.size !== undefined);
            return [
                (0, endent_1.default) `
          let (${newIndexVar}) = ${func.name}(
            bytes_index,
            bytes_array,
            0,
            ${type.size},
            ${varToEncode},
          );
        `,
                [func],
            ];
        }
        // Is value type
        const size = (0, nodeTypeProcessing_1.getPackedByteSize)(type, this.ast.inference);
        const instructions = [];
        const importedFunc = [];
        // packed size of addresses is 32 bytes, but they are treated as felts,
        // so they should be converted to Uint256 accordingly
        if (size < 32 || (0, nodeTypeProcessing_1.isAddressType)(type)) {
            instructions.push(`let (${varToEncode}256) = felt_to_uint256(${varToEncode});`);
            importedFunc.push(this.requireImport(...importPaths_1.FELT_TO_UINT256));
            varToEncode = `${varToEncode}256`;
        }
        instructions.push(...[
            `${func.name}(bytes_index, bytes_array, 0, ${varToEncode});`,
            `let ${newIndexVar} = bytes_index + 32;`,
        ]);
        return [instructions.join('\n'), importedFunc];
    }
    createDynamicArrayHeadEncoding(type) {
        const key = 'head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const tailEncoding = this.createDynamicArrayTailEncoding(type);
        const name = `${this.functionName}_head_dynamic_array_spl${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index: felt,
        bytes_array: felt*,
        mem_ptr : felt
      ) -> (final_bytes_index : felt){
        alloc_locals;
        let (length256) = wm_dyn_array_length(mem_ptr);
        let (length) = narrow_safe(length256);
        // Storing the element values encoding
        let (new_index) = ${tailEncoding.name}(
          bytes_index,
          bytes_array,
          0,
          length,
          mem_ptr
        );
        return (
          final_bytes_index=new_index,
        );
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.NARROW_SAFE),
        ];
        const funcInfo = { name, code, functionsCalled: [...importedFuncs, tailEncoding] };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createDynamicArrayTailEncoding(type) {
        const key = 'tail ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const elementTSize = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast).width;
        const [readElement, readFunc] = this.readMemory(elementT, 'elem_loc');
        const [headEncodingCode, functionsCalled] = this.generateEncodingCode(elementT, 'bytes_index', 'elem');
        const name = `${this.functionName}_tail_dynamic_array_spl${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_array : felt*,
        index : felt,
        length : felt,
        mem_ptr : felt
      ) -> (final_index : felt){
        alloc_locals;
        if (index == length){
           return (final_index=bytes_index);
        }
        let (index256) = felt_to_uint256(index);
        let (elem_loc) = wm_index_dyn(mem_ptr, index256, ${(0, utils_1.uint256)(elementTSize)});
        let (elem) = ${readElement};
        ${headEncodingCode}
        return ${name}(bytes_index, bytes_array, index + 1, length, mem_ptr);
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.WM_INDEX_DYN),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
        ];
        const funcInfo = {
            name,
            code,
            functionsCalled: [...importedFuncs, ...functionsCalled, readFunc],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStaticArrayHeadEncoding(type) {
        (0, assert_1.default)(type.size !== undefined);
        const key = 'head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const inlineEncoding = this.createArrayInlineEncoding(type);
        const name = `${this.functionName}_head_static_array_spl${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_array : felt*,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt){
        alloc_locals;
        let length = ${type.size};
        // Storing the data values encoding
        let (bytes_index) = ${inlineEncoding}(
          bytes_index,
          bytes_array,
          0,
          length,
          mem_ptr
        );
        return (
          final_bytes_index=new_bytes_index,
        );
      }
      `;
        const importedFunc = this.requireImport(...importPaths_1.FELT_TO_UINT256);
        const funcInfo = { name, code, functionsCalled: [importedFunc] };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createArrayInlineEncoding(type) {
        const key = 'inline ' + (0, base_2.removeSizeInfo)(type);
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const elementTWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast).width;
        const [readElement, readFunc] = this.readMemory(type.elementT, 'elem_loc');
        const [headEncodingCode, functionsCalled] = this.generateEncodingCode(type.elementT, 'bytes_index', 'elem');
        const name = `${this.functionName}_inline_array_spl${this.auxiliarGeneratedFunctions.size}`;
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
        let elem_loc = mem_ptr + ${(0, base_1.mul)('mem_index', elementTWidth)};
        let (elem) = ${readElement};
        ${headEncodingCode}
        return ${name}(
           bytes_index,
           bytes_array,
           mem_index + 1,
           mem_length,
           mem_ptr
        );
      }
      `;
        const funcInfo = { name, code, functionsCalled: [...functionsCalled, readFunc] };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStructHeadEncoding(type, def) {
        const key = 'struct head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const inlineEncoding = this.createStructInlineEncoding(type, def);
        const name = `${this.functionName}_head_spl_${def.name}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_array : felt*,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt){
        alloc_locals;
        // Storing the data values encoding
        let (bytes_index) = ${inlineEncoding}(
          bytes_index,
          bytes_array,
          mem_ptr
      );
        return (bytes_index,);
      }
      `;
        const importedFunction = this.requireImport(...importPaths_1.FELT_TO_UINT256);
        const funcInfo = { name, code, functionsCalled: [importedFunction, inlineEncoding] };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStructInlineEncoding(type, def) {
        const key = 'struct inline ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const encodingInfo = def.vMembers.map((member, index) => {
            const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(member, this.ast.inference))[0];
            const elemWidth = cairoTypeSystem_1.CairoType.fromSol(type, this.ast).width;
            const [readElement, readFunc] = this.readMemory(type, 'mem_ptr');
            const [encoding, functionsCalled] = this.generateEncodingCode(type, 'bytes_index', `elem${index}`);
            return [
                (0, endent_1.default) `
            // Encoding member ${member.name}
            let (elem${index}) = ${readElement};
            ${encoding}
            let mem_ptr = mem_ptr + ${elemWidth};
          `,
                [...functionsCalled, readFunc],
            ];
        });
        const [instructions, functionsCalled] = encodingInfo.reduce(([instructions, functionsCalled], [currentInstruction, currentFuncs]) => [
            [...instructions, currentInstruction],
            [...functionsCalled, ...currentFuncs],
        ], [new Array(), new Array()]);
        const name = `${this.functionName}_inline_struct_spl_${def.name}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_array : felt*,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt){
        alloc_locals;
        ${instructions.join('\n')}
        return (bytes_index,);
      }
    `;
        const funcInfo = { name, code, functionsCalled };
        const auxFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStringOrBytesHeadEncoding() {
        const funcName = 'bytes_to_felt_dynamic_array_spl';
        return this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
    }
    createStringOrBytesHeadEncodingWithoutPadding() {
        const funcName = 'bytes_to_felt_dynamic_array_spl_without_padding';
        return this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
    }
    createValueTypeHeadEncoding() {
        const funcName = 'fixed_bytes256_to_felt_dynamic_array_spl';
        return this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
    }
    readMemory(type, arg) {
        const func = this.memoryRead.getOrCreateFuncDef(type);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast);
        const args = cairoType instanceof cairoTypeSystem_1.MemoryLocation
            ? [arg, (0, nodeTypeProcessing_1.isDynamicArray)(type) ? (0, utils_1.uint256)(2) : (0, utils_1.uint256)(0)]
            : [arg];
        return [`${func.name}(${args.join(',')})`, func];
    }
}
exports.IndexEncode = IndexEncode;
//# sourceMappingURL=indexEncode.js.map