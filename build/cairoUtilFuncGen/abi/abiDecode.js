"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiDecode = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
const base_2 = require("./base");
const importPaths_1 = require("../../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
class AbiDecode extends base_1.StringIndexedFuncGenWithAuxiliar {
    constructor(memoryWrite, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.functionName = 'abi_decode';
        this.memoryWrite = memoryWrite;
    }
    gen(expressions) {
        (0, assert_1.default)(expressions.length === 2, 'ABI decode must receive two arguments: data to decode, and types to decode into');
        const [data, types] = expressions.map((t) => (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(t, this.ast.inference))[0]);
        (0, assert_1.default)(data instanceof solc_typed_ast_1.BytesType, `Data must be of BytesType instead of ${(0, astPrinter_1.printTypeNode)(data)}`);
        const typesToDecode = types instanceof solc_typed_ast_1.TupleType ? types.elements : [types];
        const generatedFunction = this.getOrCreateFuncDef(typesToDecode.map((t) => (0, solc_typed_ast_1.generalizeType)(t)[0]));
        return (0, functionGeneration_1.createCallToFunction)(generatedFunction, [expressions[0]], this.ast);
    }
    getOrCreateFuncDef(types) {
        const key = types.map((t) => t.pp()).join(',');
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(types);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['data', (0, nodeTemplates_1.createBytesTypeName)(this.ast), solc_typed_ast_1.DataLocation.Memory]], types.map((t, index) => (0, nodeTypeProcessing_1.isValueType)(t)
            ? [`result${index}`, (0, utils_1.typeNameFromTypeNode)(t, this.ast)]
            : [`result${index}`, (0, utils_1.typeNameFromTypeNode)(t, this.ast), solc_typed_ast_1.DataLocation.Memory]), this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(types) {
        const [returnParams, decodings, functionsCalled] = types.reduce(([returnParams, decodings, functionsCalled], type, index) => {
            const newReturnParams = [
                ...returnParams,
                {
                    name: `result${index}`,
                    type: cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).toString(),
                },
            ];
            const [newDecodings, newFunctionsCalled] = this.generateDecodingCode(type, 'mem_index', `result${index}`, 'mem_index');
            return [
                newReturnParams,
                [...decodings, `// Param ${index} decoding:`, newDecodings],
                [...functionsCalled, ...newFunctionsCalled],
            ];
        }, [
            new Array(),
            new Array(),
            new Array(),
        ]);
        const indexLength = types.reduce((sum, t) => sum + BigInt((0, nodeTypeProcessing_1.getByteSize)(t, this.ast.inference)), 0n);
        const returnCairoParams = returnParams.map((r) => `${r.name} : ${r.type}`).join(',');
        const returnValues = returnParams.map((r) => `${r.name} = ${r.name}`).join(',');
        const funcName = `${this.functionName}${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}(mem_ptr : felt) -> (${returnCairoParams}){
        alloc_locals;
        let max_index_length: felt = ${indexLength};
        let mem_index: felt = 0;
        ${decodings}
        assert max_index_length - mem_index = 0;
        return (${returnValues});
      }
      `;
        return { name: funcName, code: code, functionsCalled: functionsCalled };
    }
    getOrCreateDecoding(type) {
        const unexpectedType = () => {
            throw new errors_1.TranspileFailedError(`Decoding of ${(0, astPrinter_1.printTypeNode)(type)} is not valid`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => type instanceof solc_typed_ast_1.ArrayType
            ? this.createDynamicArrayDecoding(type)
            : this.createStringBytesDecoding(), (type) => this.createStaticArrayDecoding(type), (type, definition) => this.createStructDecoding(type, definition), unexpectedType, (type) => this.createValueTypeDecoding((0, nodeTypeProcessing_1.getPackedByteSize)(type, this.ast.inference)));
    }
    /**
     * Given a type it generates the arguments and function to decode such type from a warp memory byte array
     * @param type type to decode
     * @param newIndexVar cairo var to store new index position after decoding the type
     * @param decodeResult cairo var that stores the result of the decoding
     * @param relativeIndexVar cairo var to handle offset values
     * @returns the generated code and functions called
     */
    generateDecodingCode(type, newIndexVar, decodeResult, relativeIndexVar) {
        (0, assert_1.default)(!(type instanceof solc_typed_ast_1.PointerType), 'Pointer types are not valid types for decoding. Try to generalize them');
        // address types get special treatment due to different byte size in ethereum and starknet
        if ((0, nodeTypeProcessing_1.isAddressType)(type)) {
            const func = this.createValueTypeDecoding(31);
            return [
                (0, endent_1.default) `
          let (${decodeResult} : felt) = ${func.name}(mem_index, mem_index + 32, mem_ptr, 0);
          let ${newIndexVar} = mem_index + 32;
        `,
                [func],
            ];
        }
        const auxFunc = this.getOrCreateDecoding(type);
        const importedFuncs = [];
        if ((0, nodeTypeProcessing_1.isReferenceType)(type)) {
            // Find where the type is encoded in the bytes array:
            //  - Value types, or reference types which size can be known in compile
            //    time are encoded in place (like structs of value types and static array of
            //    value types)
            //  - Dynamic arrays or nested reference types actual location is encoded at
            //    the current location (i.e. [mem_index, mem_index + 32]). After reading the
            //    actual location, the decoding process starts from there.
            let initInstructions = [];
            let typeIndex = 'mem_index';
            if ((0, nodeTypeProcessing_1.isDynamicallySized)(type, this.ast.inference)) {
                importedFuncs.push(this.requireImport(...importPaths_1.BYTE_ARRAY_TO_FELT_VALUE));
                initInstructions = [
                    `let (param_offset) = byte_array_to_felt_value(mem_index, mem_index + 32, mem_ptr, 0);`,
                    `let mem_offset = ${calcOffset('mem_index', 'param_offset', relativeIndexVar)};`,
                ];
                typeIndex = 'mem_offset';
            }
            // Handle the initialization of arguments and call of the corresponding
            // decoding function.
            let callInstructions;
            if ((0, nodeTypeProcessing_1.isDynamicArray)(type)) {
                const elementTWidth = cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.getElementType)(type), this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
                callInstructions = [
                    `let (${decodeResult}_dyn_array_length) = byte_array_to_felt_value(`,
                    `  ${typeIndex},`,
                    `  ${typeIndex} + 32,`,
                    `  mem_ptr,`,
                    `  0`,
                    `);`,
                    `let (${decodeResult}_dyn_array_length256) = felt_to_uint256(${decodeResult}_dyn_array_length);`,
                    `let (${decodeResult}) = wm_new(${decodeResult}_dyn_array_length256, ${(0, utils_2.uint256)(elementTWidth)});`,
                    `${auxFunc.name}(`,
                    `  ${typeIndex} + 32,`,
                    `  mem_ptr,`,
                    `  0,`,
                    `  ${decodeResult}_dyn_array_length,`,
                    `  ${decodeResult}`,
                    `);`,
                ];
                // Other relevant imports get added when the function is generated
                importedFuncs.push(this.requireImport(...importPaths_1.WM_NEW));
            }
            else if (type instanceof solc_typed_ast_1.ArrayType) {
                // Handling static arrays
                (0, assert_1.default)(type.size !== undefined);
                const elemenTWidth = BigInt(cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width);
                callInstructions = [
                    `let (${decodeResult}) = wm_alloc(${(0, utils_2.uint256)(type.size * elemenTWidth)});`,
                    `${auxFunc.name}(`,
                    `  ${typeIndex},`,
                    `  mem_ptr,`,
                    `  0,`,
                    `  ${type.size},`,
                    `  ${decodeResult}`,
                    `);`,
                ];
                importedFuncs.push(this.requireImport(...importPaths_1.WM_ALLOC));
            }
            else if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
                const maxSize = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation).width;
                callInstructions = [
                    `let (${decodeResult}) = wm_alloc(${(0, utils_2.uint256)(maxSize)});`,
                    `${auxFunc.name}(`,
                    `  ${typeIndex},`,
                    `  mem_ptr,`,
                    `  ${decodeResult}`,
                    `);`,
                ];
                importedFuncs.push(this.requireImport(...importPaths_1.WM_ALLOC));
            }
            else {
                throw new errors_1.TranspileFailedError(`Unexpected reference type to generate decoding code: ${(0, astPrinter_1.printTypeNode)(type)}`);
            }
            return [
                (0, endent_1.default) `
          ${initInstructions.join('\n')}
          ${callInstructions.join('\n')}
          let ${newIndexVar} = mem_index + ${(0, nodeTypeProcessing_1.getByteSize)(type, this.ast.inference)};
        `,
                [...importedFuncs, auxFunc],
            ];
        }
        // Handling value types
        const byteSize = Number((0, nodeTypeProcessing_1.getPackedByteSize)(type, this.ast.inference));
        const args = [
            (0, base_1.add)('mem_index', 32 - byteSize),
            'mem_index + 32',
            'mem_ptr',
            '0', // inital accumulator
        ];
        if (byteSize === 32) {
            args.push('0');
            importedFuncs.push(this.requireImport(...importPaths_1.U128_FROM_FELT));
        }
        const decodeType = byteSize === 32 ? 'Uint256' : 'felt';
        return [
            (0, endent_1.default) `
        let (${decodeResult} : ${decodeType}) = ${auxFunc.name}(${args.join(',')});
        let ${newIndexVar} = mem_index + 32;
      `,
            [...importedFuncs, auxFunc],
        ];
    }
    createStaticArrayDecoding(type) {
        (0, assert_1.default)(type.size !== undefined);
        const key = 'static' + (0, base_2.removeSizeInfo)(type);
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const elementTWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast).width;
        const [decodingCode, functionsCalled] = this.generateDecodingCode(type.elementT, 'next_mem_index', 'element', '32 * array_index');
        const getMemLocCode = `let write_to_mem_location = array_ptr + ${(0, base_1.mul)('array_index', elementTWidth)};`;
        const writeToMemFunc = this.memoryWrite.getOrCreateFuncDef(type.elementT);
        const writeToMemCode = `${writeToMemFunc.name}(write_to_mem_location, element);`;
        const name = `${this.functionName}_static_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        mem_index: felt,
        mem_ptr: felt,
        array_index: felt,
        array_length: felt,
        array_ptr: felt,
      ){
        alloc_locals;
        if (array_index == array_length) {
          return ();
        }
        ${decodingCode}
        ${getMemLocCode}
        ${writeToMemCode}
        return ${name}(next_mem_index, mem_ptr, array_index + 1, array_length, array_ptr);
      }
      `;
        const funcInfo = {
            name,
            code,
            functionsCalled: [this.requireImport(...importPaths_1.FELT_TO_UINT256), ...functionsCalled, writeToMemFunc],
        };
        const generatedFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, generatedFunc);
        return generatedFunc;
    }
    createDynamicArrayDecoding(type) {
        const key = 'dynamic' + type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const elemenTWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
        const [decodingCode, functionsCalled] = this.generateDecodingCode(elementT, 'next_mem_index', 'element', '32 * dyn_array_index');
        const getMemLocCode = (0, endent_1.default) `
      let (dyn_array_index256) = felt_to_uint256(dyn_array_index);
      let (write_to_mem_location) = wm_index_dyn(dyn_array_ptr, dyn_array_index256, ${(0, utils_2.uint256)(elemenTWidth)});
    `;
        const writeToMemFunc = this.memoryWrite.getOrCreateFuncDef(elementT);
        const writeToMemCode = `${writeToMemFunc.name}(write_to_mem_location, element);`;
        const name = `${this.functionName}_dynamic_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        mem_index: felt,
        mem_ptr: felt,
        dyn_array_index: felt,
        dyn_array_length: felt,
        dyn_array_ptr: felt
      ){
        alloc_locals;
        if (dyn_array_index == dyn_array_length){
          return ();
        }
        ${decodingCode}
        ${getMemLocCode}
        ${writeToMemCode}
        return ${name}(
          next_mem_index,
          mem_ptr,
          dyn_array_index + 1,
          dyn_array_length,
          dyn_array_ptr
        );
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.WM_INDEX_DYN),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.NARROW_SAFE),
        ];
        const funcInfo = {
            name,
            code,
            functionsCalled: [...importedFuncs, ...functionsCalled, writeToMemFunc],
        };
        const generatedFunc = this.createAuxiliarGeneratedFunction(funcInfo);
        this.auxiliarGeneratedFunctions.set(key, generatedFunc);
        return generatedFunc;
    }
    createStructDecoding(type, definition) {
        const key = type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined)
            return existing;
        let indexWalked = 0;
        let structWriteLocation = 0;
        const decodingInfo = definition.vMembers.map((member, index) => {
            const [type] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(member, this.ast.inference));
            const elemWidth = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
            const [decodingCode, functionsCalled] = this.generateDecodingCode(type, 'mem_index', `member${index}`, `${indexWalked}`);
            indexWalked += Number((0, nodeTypeProcessing_1.getByteSize)(type, this.ast.inference));
            structWriteLocation += index * elemWidth;
            const getMemLocCode = `let mem_to_write_loc = ${(0, base_1.add)('struct_ptr', structWriteLocation)};`;
            const writeMemLocFunc = this.memoryWrite.getOrCreateFuncDef(type);
            const writeMemLocCode = `${writeMemLocFunc.name}(mem_to_write_loc, member${index});`;
            return [
                (0, endent_1.default) `
            // Decoding member ${member.name}
            ${decodingCode}
            ${getMemLocCode}
            ${writeMemLocCode}
          `,
                [...functionsCalled, writeMemLocFunc],
            ];
        });
        const instructions = decodingInfo.map((info) => info[0]);
        const functionsCalled = decodingInfo.flatMap((info) => info[1]);
        const name = `${this.functionName}_struct_${definition.name}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${name}(
        mem_index: felt,
        mem_ptr: felt,
        struct_ptr: felt
      ){
        alloc_locals;
        ${instructions}
        return ();
      }
      `;
        const importedFuncs = [this.requireImport(...importPaths_1.FELT_TO_UINT256)];
        const genFuncInfo = {
            name,
            code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
        const auxFunc = this.createAuxiliarGeneratedFunction(genFuncInfo);
        this.auxiliarGeneratedFunctions.set(key, auxFunc);
        return auxFunc;
    }
    createStringBytesDecoding() {
        const funcName = 'memory_dyn_array_copy';
        const importedFunc = this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
        return importedFunc;
    }
    createValueTypeDecoding(byteSize) {
        const funcName = byteSize === 32 ? 'byte_array_to_uint256_value' : 'byte_array_to_felt_value';
        const importedFunc = this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, funcName);
        return importedFunc;
    }
}
exports.AbiDecode = AbiDecode;
function calcOffset(indexLocation, offsetLocation, substractor) {
    if (indexLocation === substractor)
        return offsetLocation;
    if (offsetLocation === substractor)
        return indexLocation;
    if (substractor === '0')
        return `${indexLocation} + ${offsetLocation}`;
    return `${indexLocation} + ${offsetLocation} - ${substractor}`;
}
//# sourceMappingURL=abiDecode.js.map