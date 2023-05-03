"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageToMemoryGen = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
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
  Generates functions to copy data from WARP_STORAGE to warp_memory
  Specifically this has to deal with structs, static arrays, and dynamic arrays
  These require extra care because the representations are different in storage and memory
  In storage nested structures are stored in place, whereas in memory 'pointers' are used
*/
class StorageToMemoryGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
    }
    gen(node) {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(type);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [node], this.ast);
    }
    getOrCreateFuncDef(type) {
        type = (0, solc_typed_ast_1.generalizeType)(type)[0];
        const key = type.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Storage]], [['mem_loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.View });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from storage to memory not implemented yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type, def) => this.createStructCopyFunction(type, def), unexpectedTypeFunc, unexpectedTypeFunc);
    }
    createStructCopyFunction(type, def) {
        const memoryType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        const [copyInstructions, copyCalls] = generateCopyInstructions(type, this.ast).reduce(([copyInstructions, copyCalls], { storageOffset, copyType }, index) => {
            const [copyCode, calls] = this.getIterCopyCode(copyType, index, storageOffset);
            return [
                [
                    ...copyInstructions,
                    copyCode,
                    `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', index)}, copy${index});`,
                ],
                [...copyCalls, ...calls],
            ];
        }, [new Array(), new Array()]);
        const funcName = `ws_to_memory${this.generatedFunctionsDef.size}_struct_${def.name}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(loc : felt) -> (mem_loc: felt){
          alloc_locals;
          let (mem_start) = wm_alloc(${(0, utils_2.uint256)(memoryType.width)});
          ${copyInstructions.join('\n')}
          return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.WM_ALLOC),
                ...copyCalls,
            ],
        };
        return funcInfo;
    }
    createStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined, 'Expected static array with known size');
        return type.size <= 5
            ? this.createSmallStaticArrayCopyFunction(type)
            : this.createLargeStaticArrayCopyFunction(type);
    }
    createSmallStaticArrayCopyFunction(type) {
        const memoryType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        const [copyInstructions, copyCalls] = generateCopyInstructions(type, this.ast).reduce(([copyInstructions, copyCalls], { storageOffset, copyType }, index) => {
            const [copyCode, calls] = this.getIterCopyCode(copyType, index, storageOffset);
            return [
                [
                    ...copyInstructions,
                    copyCode,
                    `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', index)}, copy${index});`,
                ],
                [...copyCalls, ...calls],
            ];
        }, [new Array(), new Array()]);
        const funcName = `ws_to_memory_small_static_array${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(loc : felt) -> (mem_loc : felt){
          alloc_locals;
          let length = ${(0, utils_2.uint256)(memoryType.width)};
          let (mem_start) = wm_alloc(length);
          ${copyInstructions.join('\n')}
          return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.WM_ALLOC),
                ...copyCalls,
            ],
        };
        return funcInfo;
    }
    createLargeStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined, 'Expected static array with known size');
        const length = (0, utils_1.narrowBigIntSafe)(type.size, `Failed to narrow size of ${(0, astPrinter_1.printTypeNode)(type)} in memory->storage copy generation`);
        const elementMemoryWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast).width;
        const elementStorageWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const [copyCode, copyCalls] = this.getRecursiveCopyCode(type.elementT, elementMemoryWidth, 'loc', 'mem_start');
        const funcName = `ws_to_memory_large_static_array${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}_elem(mem_start: felt, loc : felt, length: Uint256) -> (){
          alloc_locals;
          if (length.low == 0){
            if (length.high == 0){
              return ();
            }
          }
          let (index) = uint256_sub(length, Uint256(1, 0));
          ${copyCode}
          return ${funcName}_elem(${(0, base_1.add)('mem_start', elementMemoryWidth)}, ${(0, base_1.add)('loc', elementStorageWidth)}, index);
        }

        #[implicit(warp_memory)]
        func ${funcName}(loc : felt) -> (mem_loc : felt){
            alloc_locals;
            let length = ${(0, utils_2.uint256)(length)};
            let (mem_start) = wm_alloc(length);
            ${funcName}_elem(mem_start, loc, length);
            return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.WM_ALLOC),
                this.requireImport(...importPaths_1.UINT256_SUB),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                ...copyCalls,
            ],
        };
        return funcInfo;
    }
    createDynamicArrayCopyFunction(type) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const memoryElementType = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementT);
        const elemMappingName = dynArray.name;
        const lengthMappingName = dynArrayLength.name;
        // This is the code to copy a single element
        // Complex types require calls to another function generated here
        // Simple types take one or two WARP_STORAGE-dict_write pairs
        const [copyCode, copyCalls] = this.getRecursiveCopyCode(elementT, memoryElementType.width, 'element_storage_loc', 'mem_loc');
        const funcName = `ws_to_memory_dynamic_array${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}_elem(storage_name: felt, mem_start: felt, length: Uint256) -> (){
            alloc_locals;
            if (length.low == 0 and length.high == 0){
                return ();
            }
            let (index) = uint256_sub(length, Uint256(1,0));
            let (mem_loc) = wm_index_dyn(mem_start, index, ${(0, utils_2.uint256)(memoryElementType.width)});
            let (element_storage_loc) = ${elemMappingName}.read(storage_name, index);
            ${copyCode}
            return ${funcName}_elem(storage_name, mem_start, index);
        }

        #[implicit(warp_memory)]
        func ${funcName}(loc : felt) -> (mem_loc : felt){
            alloc_locals;
            let (length: Uint256) = ${lengthMappingName}.read(loc);
            let (mem_start) = wm_new(length, ${(0, utils_2.uint256)(memoryElementType.width)});
            ${funcName}_elem(loc, mem_start, length);
            return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.UINT256_SUB),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.WM_NEW),
                this.requireImport(...importPaths_1.WM_INDEX_DYN),
                ...copyCalls,
                dynArray,
                dynArrayLength,
            ],
        };
        return funcInfo;
    }
    // Copy code generation for iterative copy instructions (small static arrays and structs)
    getIterCopyCode(copyType, index, storageOffset) {
        if (copyType === undefined) {
            return [`let (copy${index}) = WARP_STORAGE.read(${(0, base_1.add)('loc', storageOffset)});`, []];
        }
        const func = this.getOrCreateFuncDef(copyType);
        return [
            (0, nodeTypeProcessing_1.isDynamicArray)(copyType)
                ? (0, endent_1.default) `
            let (dyn_loc) = WARP_STORAGE.read(${(0, base_1.add)('loc', storageOffset)});
            let (copy${index}) = ${func.name}(dyn_loc);
          `
                : `let (copy${index}) = ${func.name}(${(0, base_1.add)('loc', storageOffset)});`,
            [func],
        ];
    }
    // Copy code generation for recursive copy instructions (large static arrays and dynamic arrays)
    getRecursiveCopyCode(elementT, elementMemoryWidth, storageLoc, memoryLoc) {
        if ((0, solc_typed_ast_1.isReferenceType)(elementT)) {
            const auxFunc = this.getOrCreateFuncDef(elementT);
            if (isStaticArrayOrStruct(elementT)) {
                return [
                    (0, endent_1.default) `
            let (copy) = ${auxFunc.name}(${storageLoc});
            dict_write{dict_ptr=warp_memory}(${memoryLoc}, copy);
          `,
                    [auxFunc],
                ];
            }
            else if ((0, nodeTypeProcessing_1.isDynamicArray)(elementT)) {
                return [
                    (0, endent_1.default) `
            let (dyn_loc) = readId(${storageLoc});
            let (copy) = ${auxFunc.name}(dyn_loc);
            dict_write{dict_ptr=warp_memory}(${memoryLoc}, copy);
          `,
                    [auxFunc],
                ];
            }
            throw new export_1.TranspileFailedError(`Trying to create recursive code for unsupported reference type: ${(0, astPrinter_1.printTypeNode)(elementT)}`);
        }
        return [
            (0, utils_1.mapRange)(elementMemoryWidth, (n) => (0, endent_1.default) `
          let (copy) = WARP_STORAGE.read(${(0, base_1.add)(`${storageLoc}`, n)});
          dict_write{dict_ptr=warp_memory}(${(0, base_1.add)(`${memoryLoc}`, n)}, copy);
        `).join('\n'),
            [],
        ];
    }
}
exports.StorageToMemoryGen = StorageToMemoryGen;
function generateCopyInstructions(type, ast) {
    let members;
    if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        members = type.definition.vMembers.map((decl) => (0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference));
    }
    else if (type instanceof solc_typed_ast_1.ArrayType && type.size !== undefined) {
        const narrowedWidth = (0, utils_1.narrowBigIntSafe)(type.size, `Array size ${type.size} not supported`);
        members = (0, utils_1.mapRange)(narrowedWidth, () => type.elementT);
    }
    else {
        throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from storage to memory not implemented yet`);
    }
    let storageOffset = 0;
    return members.flatMap((memberType) => {
        if (isStaticArrayOrStruct(memberType)) {
            const offset = storageOffset;
            storageOffset += cairoTypeSystem_1.CairoType.fromSol(memberType, ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
            return [{ storageOffset: offset, copyType: memberType }];
        }
        else if ((0, nodeTypeProcessing_1.isDynamicArray)(memberType)) {
            return [{ storageOffset: storageOffset++, copyType: memberType }];
        }
        else {
            const width = cairoTypeSystem_1.CairoType.fromSol(memberType, ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
            return (0, utils_1.mapRange)(width, () => ({ storageOffset: storageOffset++ }));
        }
    });
}
function isStaticArrayOrStruct(type) {
    return ((type instanceof solc_typed_ast_1.ArrayType && type.size !== undefined) ||
        (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition));
}
//# sourceMappingURL=storageToMemory.js.map