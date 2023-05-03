"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryToStorageGen = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
/*
  Generates functions to copy data from warp_memory to WARP_STORAGE
  Specifically this has to deal with structs, static arrays, and dynamic arrays
  These require extra care because the representations are different in storage and memory
  In storage nested structures are stored in place, whereas in memory 'pointers' are used
*/
class MemoryToStorageGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, memoryReadGen, storageDeleteGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.memoryReadGen = memoryReadGen;
        this.storageDeleteGen = storageDeleteGen;
    }
    gen(storageLocation, memoryLocation) {
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(storageLocation, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(type);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [storageLocation, memoryLocation], this.ast);
    }
    getOrCreateFuncDef(type) {
        const key = type.pp();
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['mem_loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Memory],
        ], [['loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.View });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from memory to storage not implemented yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type, def) => this.createStructCopyFunction(type, def), unexpectedTypeFunc, unexpectedTypeFunc);
    }
    // This can also be used for static arrays, in which case they are treated
    // like structs with <length> members of the same type
    createStructCopyFunction(_type, def) {
        const funcName = `wm_to_storage_struct_${def.name}`;
        const [copyInstructions, funcsCalled] = this.generateTupleCopyInstructions(def.vMembers.map((decl) => (0, nodeTypeProcessing_1.safeGetNodeType)(decl, this.ast.inference)));
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(loc : felt, mem_loc: felt) -> (loc: felt){
            alloc_locals;
            ${copyInstructions}
            return (loc,);
        }
      `,
            functionsCalled: funcsCalled,
        };
    }
    createStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined, 'Expected static array with known size');
        return type.size <= 5
            ? this.createSmallStaticArrayCopyFunction(type)
            : this.createLargeStaticArrayCopyFunction(type);
    }
    createSmallStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined);
        const size = (0, utils_1.narrowBigIntSafe)(type.size, 'Static array size is unsupported');
        const [copyInstructions, funcsCalled] = this.generateTupleCopyInstructions(new Array(size).fill(type.elementT));
        const funcName = `wm_to_storage_static_array_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(loc : felt, mem_loc: felt) -> (loc: felt){
            alloc_locals;
            ${copyInstructions}
            return (loc,);
        }
        `,
            functionsCalled: funcsCalled,
        };
    }
    createLargeStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined, 'Expected static array with known size');
        const length = (0, utils_1.narrowBigIntSafe)(type.size, `Failed to narrow size of ${(0, astPrinter_1.printTypeNode)(type)} in memory->storage copy generation`);
        const elementStorageWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const elementMemoryWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast).width;
        let copyCode;
        let calledFuncs;
        if ((0, nodeTypeProcessing_1.isDynamicArray)(type.elementT)) {
            const readFunc = this.memoryReadGen.getOrCreateFuncDef(type.elementT);
            const auxFunc = this.getOrCreateFuncDef(type.elementT);
            copyCode = (0, endent_1.default) `
          let (storage_id) = readId(storage_loc);
          let (memory_id) = ${readFunc.name}(mem_loc, ${(0, utils_2.uint256)(2)});
          ${auxFunc.name}(storage_id, memory_id);
      `;
            calledFuncs = [readFunc, auxFunc];
        }
        else if ((0, nodeTypeProcessing_1.isStruct)(type.elementT)) {
            const readFunc = this.memoryReadGen.getOrCreateFuncDef(type.elementT);
            const auxFunc = this.getOrCreateFuncDef(type.elementT);
            copyCode = (0, endent_1.default) `
        let (memory_id) = ${readFunc.name}{dict_ptr=warp_memory}(mem_loc, ${(0, utils_2.uint256)(elementMemoryWidth)});
        ${auxFunc.name}(storage_loc, memory_id);
      `;
            calledFuncs = [readFunc, auxFunc];
        }
        else {
            copyCode = (0, utils_1.mapRange)(elementStorageWidth, (n) => (0, endent_1.default) `
            let (copy) = dict_read{dict_ptr=warp_memory}(${(0, base_1.add)('mem_loc', n)});
            WARP_STORAGE.write(${(0, base_1.add)('storage_loc', n)}, copy);
        `).join('\n');
            calledFuncs = [this.requireImport(...importPaths_1.DICT_READ)];
        }
        const funcName = `wm_to_storage_static_array_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}_elem(storage_loc: felt, mem_loc : felt, length: felt) -> (){
          alloc_locals;
          if (length == 0){
              return ();
          }
          let index = length - 1;
          ${copyCode}
          return ${funcName}_elem(${(0, base_1.add)('storage_loc', elementStorageWidth)}, ${(0, base_1.add)('mem_loc', elementMemoryWidth)}, index);
        }

        #[implicit(warp_memory)]
        func ${funcName}(loc : felt, mem_loc : felt) -> (loc : felt){
            alloc_locals;
            ${funcName}_elem(loc, mem_loc, ${length});
            return (loc,);
        }
      `,
            functionsCalled: calledFuncs,
        };
    }
    createDynamicArrayCopyFunction(type) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementT);
        const elemMappingName = dynArray.name;
        const lengthMappingName = dynArrayLength.name;
        const elementStorageWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const elementMemoryWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast).width;
        let copyCode;
        let funcCalls;
        if ((0, nodeTypeProcessing_1.isReferenceType)(elementT)) {
            const readFunc = this.memoryReadGen.getOrCreateFuncDef(elementT);
            const auxFunc = this.getOrCreateFuncDef(elementT);
            copyCode = (0, nodeTypeProcessing_1.isDynamicArray)(elementT)
                ? (0, endent_1.default) `
            let (storage_id) = readId(storage_loc);
            let (read) = ${readFunc.name}(mem_loc, ${(0, utils_2.uint256)(2)});
            ${auxFunc.name}(storage_id, read);
          `
                : (0, endent_1.default) `
            let (read) = ${readFunc.name}(mem_loc, ${(0, utils_2.uint256)(elementMemoryWidth)});
            ${auxFunc.name}(storage_loc, read);
          `;
            funcCalls = [readFunc, auxFunc];
        }
        else {
            copyCode = (0, utils_1.mapRange)(elementStorageWidth, (n) => (0, endent_1.default) `
          let (copy) = dict_read{dict_ptr=warp_memory}(${(0, base_1.add)('mem_loc', n)});
          WARP_STORAGE.write(${(0, base_1.add)('storage_loc', n)}, copy);
        `).join('\n');
            funcCalls = [this.requireImport(...importPaths_1.DICT_READ)];
        }
        const deleteFunc = this.storageDeleteGen.getOrCreateFuncDef(type);
        const auxDeleteFuncName = deleteFunc.name + '_elem';
        const deleteRemainingCode = `${auxDeleteFuncName}(loc, mem_length, length);`;
        const funcName = `wm_to_storage_dynamic_array${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}_elem(storage_name: felt, mem_loc : felt, length: Uint256) -> (){
            alloc_locals;
            if (length.low == 0 and length.high == 0){
                return ();
            }
            let (index) = uint256_sub(length, Uint256(1,0));
            let (storage_loc) = ${elemMappingName}.read(storage_name, index);
            let mem_loc = mem_loc - ${elementMemoryWidth};
            if (storage_loc == 0){
                let (storage_loc) = WARP_USED_STORAGE.read();
                WARP_USED_STORAGE.write(storage_loc + ${elementStorageWidth});
                ${elemMappingName}.write(storage_name, index, storage_loc);
                ${copyCode}
            return ${funcName}_elem(storage_name, mem_loc, index);
            }else{
                ${copyCode}
            return ${funcName}_elem(storage_name, mem_loc, index);
            }
        }

        #[implicit(warp_memory)]
        func ${funcName}(loc : felt, mem_loc : felt) -> (loc : felt){
            alloc_locals;
            let (length) = ${lengthMappingName}.read(loc);
            let (mem_length) = wm_dyn_array_length(mem_loc);
            ${lengthMappingName}.write(loc, mem_length);
            let (narrowedLength) = narrow_safe(mem_length);
            ${funcName}_elem(loc, mem_loc + 2 + ${elementMemoryWidth} * narrowedLength, mem_length);
            let (lesser) = uint256_lt(mem_length, length);
            if (lesser == 1){
               ${deleteRemainingCode}
               return (loc,);
            }else{
               return (loc,);
            }
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.NARROW_SAFE),
                this.requireImport(...importPaths_1.UINT256_LT),
                this.requireImport(...importPaths_1.UINT256_SUB),
                this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH),
                ...funcCalls,
                dynArray,
                dynArrayLength,
                deleteFunc,
            ],
        };
        return funcInfo;
    }
    generateTupleCopyInstructions(types) {
        const [code, funcCalls] = types.reduce(([code, funcCalls, storageOffset, memOffset], type, index) => {
            const typeFeltWidth = getFeltWidth(type, this.ast);
            const readFunc = this.memoryReadGen.getOrCreateFuncDef(type);
            const elemLoc = `elem_mem_loc_${index}`;
            if ((0, nodeTypeProcessing_1.isReferenceType)(type)) {
                const auxFunc = this.getOrCreateFuncDef(type);
                const copyCode = (0, nodeTypeProcessing_1.isDynamicArray)(type)
                    ? [
                        `let (${elemLoc}) = ${readFunc.name}(${(0, base_1.add)('mem_loc', memOffset)}, ${(0, utils_2.uint256)(2)});`,
                        `let (storage_dyn_array_loc) = readId(${(0, base_1.add)('loc', storageOffset)});`,
                        `${auxFunc.name}(storage_dyn_array_loc, ${elemLoc});`,
                    ]
                    : [
                        `let (${elemLoc}) = ${readFunc.name}(${(0, base_1.add)('mem_loc', memOffset)}, ${(0, utils_2.uint256)(cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width)});`,
                        `${auxFunc.name}(${(0, base_1.add)('loc', storageOffset)}, ${elemLoc});`,
                    ];
                return [
                    [...code, ...copyCode],
                    [...funcCalls, this.requireImport(...importPaths_1.U128_FROM_FELT), readFunc, auxFunc],
                    storageOffset + typeFeltWidth,
                    memOffset + 1,
                ];
            }
            return [
                [
                    ...code,
                    ...(0, utils_1.mapRange)(typeFeltWidth, (n) => (0, endent_1.default) `
                let (${elemLoc}_prt_${n}) = dict_read{dict_ptr=warp_memory}(${(0, base_1.add)('mem_loc', memOffset + n)});
                WARP_STORAGE.write(${(0, base_1.add)('loc', storageOffset + n)}, ${elemLoc}_prt_${n});
              `),
                ],
                [...funcCalls, this.requireImport(...importPaths_1.DICT_READ)],
                storageOffset + typeFeltWidth,
                memOffset + typeFeltWidth,
            ];
        }, [new Array(), new Array(), 0, 0]);
        return [code, funcCalls];
    }
}
exports.MemoryToStorageGen = MemoryToStorageGen;
function getFeltWidth(type, ast) {
    return cairoTypeSystem_1.CairoType.fromSol(type, ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
}
//# sourceMappingURL=memoryToStorage.js.map