"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiEncode = void 0;
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
 * Given any data type produces the same output of solidity abi.encode
 * in the form of an array of felts where each element represents a byte
 */
class AbiEncode extends base_2.AbiBase {
    constructor(memoryRead, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.functionName = 'abi_encode';
        this.memoryRead = memoryRead;
    }
    getOrCreate(types) {
        const [params, encodings, functionsCalled] = types.reduce(([params, encodings, functionsCalled], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            const [paramEncoding, paramFunctionsCalled] = this.generateEncodingCode(type, 'bytes_index', 'bytes_offset', '0', `param${index}`);
            encodings.push(paramEncoding);
            return [params, encodings, functionsCalled.concat(paramFunctionsCalled)];
        }, [
            new Array(),
            new Array(),
            new Array(),
        ]);
        const initialOffset = types.reduce((pv, cv) => pv + BigInt((0, nodeTypeProcessing_1.getByteSize)(cv, this.ast.inference)), 0n);
        const cairoParams = params.map((p) => `${p.name} : ${p.type}`).join(', ');
        const funcName = `${this.functionName}${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}(${cairoParams}) -> (result_ptr : felt){
        alloc_locals;
        let bytes_index : felt = 0;
        let bytes_offset : felt = ${initialOffset};
        let (bytes_array : felt*) = alloc();
        ${encodings.join('\n')}
        let (max_length256) = felt_to_uint256(bytes_offset);
        let (mem_ptr) = wm_new(max_length256, ${(0, utils_1.uint256)(1)});
        felt_array_to_warp_memory_array(0, bytes_array, 0, mem_ptr, bytes_offset);
        return (mem_ptr,);
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.ALLOC),
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.WM_NEW),
            this.requireImport(...importPaths_1.FELT_ARRAY_TO_WARP_MEMORY_ARRAY),
        ];
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
        return funcInfo;
    }
    /**
     * Given a type generate a function that abi-encodes it
     * @param type type to encode
     * @returns the name of the generated function
     */
    getOrCreateEncoding(type) {
        const unexpectedType = () => {
            throw new errors_1.TranspileFailedError(`Encoding ${(0, astPrinter_1.printTypeNode)(type)} is not supported yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => type instanceof solc_typed_ast_1.ArrayType
            ? this.createDynamicArrayHeadEncoding(type)
            : this.createStringOrBytesHeadEncoding(), (type) => (0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference)
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
     * @param newOffsetVar cairo var where the updated offset should be stored
     * @param elementOffset used to calculate the relative offset of dynamically sized types
     * @param varToEncode variable that holds the values to encode
     * @returns instructions to encode `varToEncode`
     */
    generateEncodingCode(type, newIndexVar, newOffsetVar, elementOffset, varToEncode) {
        const func = this.getOrCreateEncoding(type);
        if ((0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference) || (0, nodeTypeProcessing_1.isStruct)(type)) {
            return [
                (0, endent_1.default) `
          let (${newIndexVar}, ${newOffsetVar}) = ${func.name}(
            bytes_index,
            bytes_offset,
            bytes_array,
            ${elementOffset}
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
          let (${newIndexVar}, ${newOffsetVar}) = ${func.name}(
            bytes_index,
            bytes_offset,
            bytes_array,
            ${elementOffset},
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
        const funcsCalled = [func];
        // packed size of addresses is 32 bytes, but they are treated as felts,
        // so they should be converted to Uint256 accordingly
        if (size < 32 || (0, nodeTypeProcessing_1.isAddressType)(type)) {
            funcsCalled.push(this.requireImport(...importPaths_1.FELT_TO_UINT256));
            instructions.push(`let (${varToEncode}256) = felt_to_uint256(${varToEncode});`);
            varToEncode = `${varToEncode}256`;
        }
        instructions.push(...[
            `${func.name}(bytes_index, bytes_array, 0, ${varToEncode});`,
            `let ${newIndexVar} = bytes_index + 32;`,
        ]);
        if (newOffsetVar !== 'bytes_offset') {
            instructions.push(`let ${newOffsetVar} = bytes_offset;`);
        }
        return [instructions.join('\n'), funcsCalled];
    }
    createDynamicArrayHeadEncoding(type) {
        const key = 'head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const elementByteSize = (0, nodeTypeProcessing_1.getByteSize)(elementT, this.ast.inference);
        const tailEncoding = this.createDynamicArrayTailEncoding(type);
        const valueEncoding = this.createValueTypeHeadEncoding();
        const name = `${this.functionName}_head_dynamic_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index: felt,
        bytes_offset: felt,
        bytes_array: felt*,
        element_offset: felt,
        mem_ptr : felt
      ) -> (final_bytes_index : felt, final_bytes_offset : felt){
        alloc_locals;
        // Storing pointer to data
        let (bytes_offset256) = felt_to_uint256(bytes_offset - element_offset);
        ${valueEncoding.name}(bytes_index, bytes_array, 0, bytes_offset256);
        let new_index = bytes_index + 32;
        // Storing the length
        let (length256) = wm_dyn_array_length(mem_ptr);
        ${valueEncoding.name}(bytes_offset, bytes_array, 0, length256);
        let bytes_offset = bytes_offset + 32;
        // Storing the data
        let (length) = narrow_safe(length256);
        let bytes_offset_offset = bytes_offset + ${(0, base_1.mul)('length', elementByteSize)};
        let (extended_offset) = ${tailEncoding.name}(
          bytes_offset,
          bytes_offset_offset,
          bytes_array,
          bytes_offset,
          0,
          length,
          mem_ptr
        );
        return (
          final_bytes_index=new_index,
          final_bytes_offset=extended_offset
        );
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.NARROW_SAFE),
        ];
        const genFuncInfo = {
            name,
            code,
            functionsCalled: [...importedFuncs, valueEncoding, tailEncoding],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
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
        const [headEncodingCode, functionsCalled] = this.generateEncodingCode(elementT, 'new_bytes_index', 'new_bytes_offset', 'element_offset', 'elem');
        const name = `${this.functionName}_tail_dynamic_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_offset : felt,
        bytes_array : felt*,
        element_offset : felt,
        index : felt,
        length : felt,
        mem_ptr : felt
      ) -> (final_offset : felt){
        alloc_locals;
        if (index == length){
           return (final_offset=bytes_offset);
        }
        let (index256) = felt_to_uint256(index);
        let (elem_loc) = wm_index_dyn(mem_ptr, index256, ${(0, utils_1.uint256)(elementTSize)});
        let (elem) = ${readElement};
        ${headEncodingCode}
        return ${name}(new_bytes_index, new_bytes_offset, bytes_array, element_offset, index + 1, length, mem_ptr);
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.WM_INDEX_DYN),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
        ];
        const genFuncInfo = {
            name,
            code,
            functionsCalled: [...importedFuncs, ...functionsCalled, readFunc],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStaticArrayHeadEncoding(type) {
        (0, assert_1.default)(type.size !== undefined);
        const key = 'head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const elementByteSize = (0, nodeTypeProcessing_1.getByteSize)(elementT, this.ast.inference);
        const inlineEncoding = this.createArrayInlineEncoding(type);
        const valueEncoding = this.createValueTypeHeadEncoding();
        const name = `${this.functionName}_head_static_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_offset : felt,
        bytes_array : felt*,
        element_offset : felt,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt, final_bytes_offset : felt){
        alloc_locals;
        // Storing pointer to data
        let (bytes_offset256) = felt_to_uint256(bytes_offset - element_offset);
        ${valueEncoding.name}(bytes_index, bytes_array, 0, bytes_offset256);
        let new_bytes_index = bytes_index + 32;
        // Storing the data
        let length = ${type.size};
        let bytes_offset_offset = bytes_offset + ${(0, base_1.mul)('length', elementByteSize)};
        let (_, extended_offset) = ${inlineEncoding.name}(
          bytes_offset,
          bytes_offset_offset,
          bytes_array,
          bytes_offset,
          0,
          length,
          mem_ptr
        );
        return (
          final_bytes_index=new_bytes_index,
          final_bytes_offset=extended_offset
        );
      `;
        const importedFunc = this.requireImport(...importPaths_1.FELT_TO_UINT256);
        const genFuncInfo = {
            name,
            code,
            functionsCalled: [importedFunc, inlineEncoding, valueEncoding],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
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
        const [headEncodingCode, functionsCalled] = this.generateEncodingCode(type.elementT, 'new_bytes_index', 'new_bytes_offset', 'element_offset', 'elem');
        const name = `${this.functionName}_inline_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_offset : felt,
        bytes_array : felt*,
        element_offset : felt,
        mem_index : felt,
        mem_length : felt,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt, final_bytes_offset : felt){
        alloc_locals;
        if (mem_index == mem_length){
           return (final_bytes_index=bytes_index, final_bytes_offset=bytes_offset);
        }
        let elem_loc = mem_ptr + ${(0, base_1.mul)('mem_index', elementTWidth)};
        let (elem) = ${readElement};
        ${headEncodingCode}
        return ${name}(
           new_bytes_index,
           new_bytes_offset,
           bytes_array,
           element_offset,
           mem_index + 1,
           mem_length,
           mem_ptr
        );
      }
      `;
        const genFuncInfo = { name, code, functionsCalled: [...functionsCalled, readFunc] };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStructHeadEncoding(type, def) {
        const key = 'struct head ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        // Get the size of all it's members
        const typeByteSize = def.vMembers.reduce((sum, varDecl) => sum +
            BigInt((0, nodeTypeProcessing_1.getByteSize)((0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, this.ast.inference))[0], this.ast.inference)), 0n);
        const inlineEncoding = this.createStructInlineEncoding(type, def);
        const valueEncoding = this.createValueTypeHeadEncoding();
        const name = `${this.functionName}_head_${def.name}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_offset : felt,
        bytes_array : felt*,
        element_offset : felt,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt, final_bytes_offset : felt){
        alloc_locals;
        // Storing pointer to data
        let (bytes_offset256) = felt_to_uint256(bytes_offset - element_offset);
        ${valueEncoding.name}(bytes_index, bytes_array, 0, bytes_offset256);
        let new_bytes_index = bytes_index + 32;
        // Storing the data
        let bytes_offset_offset = bytes_offset + ${typeByteSize};
        let (_, new_bytes_offset) = ${inlineEncoding.name}(
          bytes_offset,
          bytes_offset_offset,
          bytes_array,
          bytes_offset,
          mem_ptr
      );
        return (new_bytes_index, new_bytes_offset);
      }
      `;
        const genFuncInfo = {
            name,
            code,
            functionsCalled: [this.requireImport(...importPaths_1.FELT_TO_UINT256), inlineEncoding, valueEncoding],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStructInlineEncoding(type, def) {
        const key = 'struct inline ' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const decodingInfo = def.vMembers.map((member, index) => {
            const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(member, this.ast.inference))[0];
            const elemWidth = cairoTypeSystem_1.CairoType.fromSol(type, this.ast).width;
            const [readElement, readFunc] = this.readMemory(type, 'mem_ptr');
            const [encoding, funcsCalled] = this.generateEncodingCode(type, 'bytes_index', 'bytes_offset', 'element_offset', `elem${index}`);
            return [
                (0, endent_1.default) `
            // Encoding member ${member.name}
            let (elem${index}) = ${readElement};
            ${encoding}
            let mem_ptr = mem_ptr + ${elemWidth};
          `,
                [...funcsCalled, readFunc],
            ];
        });
        const instructions = decodingInfo.map((info) => info[0]);
        const functionsCalled = decodingInfo.flatMap((info) => info[1]);
        const name = `${this.functionName}_inline_struct_${def.name}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        bytes_index : felt,
        bytes_offset : felt,
        bytes_array : felt*,
        element_offset : felt,
        mem_ptr : felt,
      ) -> (final_bytes_index : felt, final_bytes_offset : felt){
        alloc_locals;
        ${instructions.join('\n')}
        return (bytes_index, bytes_offset);
      }
      `;
        const genFuncInfo = { name, code, functionsCalled };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStringOrBytesHeadEncoding() {
        const funcName = 'bytes_to_felt_dynamic_array';
        return this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
    }
    createValueTypeHeadEncoding() {
        const funcName = 'fixed_bytes256_to_felt_dynamic_array';
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
exports.AbiEncode = AbiEncode;
//# sourceMappingURL=abiEncode.js.map