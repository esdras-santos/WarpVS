"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageDeleteGen = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
class StorageDeleteGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageReadGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageReadGen = storageReadGen;
        this.creatingFunctions = new Map();
        this.functionDependencies = new Map();
    }
    gen(node) {
        const nodeType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(nodeType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [node], this.ast);
    }
    getOrCreateFuncDef(type) {
        const key = generateKey(type);
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Storage]], [], this.ast, this.sourceUnit);
        (0, assert_1.default)(this.creatingFunctions.delete(key), 'Cannot delete function which is not being processed');
        this.generatedFunctionsDef.set(key, funcDef);
        this.processRecursiveDependencies();
        return funcDef;
    }
    safeGetOrCreateFuncDef(parentType, type) {
        const parentKey = generateKey(parentType);
        const childKey = generateKey(type);
        const dependencies = this.functionDependencies.get(parentKey);
        if (dependencies === undefined) {
            this.functionDependencies.set(parentKey, [childKey]);
        }
        else {
            dependencies.push(childKey);
        }
        const processingName = this.creatingFunctions.get(childKey);
        if (processingName !== undefined) {
            return processingName;
        }
        return this.getOrCreateFuncDef(type).name;
    }
    getOrCreate(type) {
        const funcInfo = (0, base_1.delegateBasedOnType)(type, (type) => this.deleteDynamicArray(type), (type) => {
            (0, assert_1.default)(type.size !== undefined);
            return type.size <= 5
                ? this.deleteSmallStaticArray(type)
                : this.deleteLargeStaticArray(type);
        }, (type, def) => this.deleteStruct(type, def), (type) => this.deleteNothing(type), (type) => this.deleteGeneric(type));
        return funcInfo;
    }
    deleteGeneric(type) {
        const funcName = `WS${this.getId()}_GENERIC_DELETE`;
        this.creatingFunctions.set(generateKey(type), funcName);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast);
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(loc: felt){
            ${(0, utils_1.mapRange)(cairoType.width, (n) => `    WARP_STORAGE.write(${(0, base_1.add)('loc', n)}, 0);`).join('\n')}
            return ();
        }
      `,
            functionsCalled: [],
        };
    }
    deleteDynamicArray(type) {
        const funcName = `WS${this.getId()}_DYNAMIC_ARRAY_DELETE`;
        this.creatingFunctions.set(generateKey(type), funcName);
        const elementT = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.getElementType)(type))[0];
        const [dynArray, dynArrayLen] = this.dynArrayGen.getOrCreateFuncDef(elementT);
        const arrayName = dynArray.name;
        const lengthName = dynArrayLen.name;
        const readFunc = this.storageReadGen.getOrCreateFuncDef(elementT);
        const auxDeleteFuncName = this.safeGetOrCreateFuncDef(type, elementT);
        const deleteCode = requiresReadBeforeRecursing(elementT)
            ? [`   let (elem_id) = ${readFunc.name}(elem_loc);`, `   ${auxDeleteFuncName}(elem_id);`]
            : [`    ${auxDeleteFuncName}(elem_loc);`];
        const deleteFunc = (0, endent_1.default) `
      func ${funcName}_elem(loc : felt, index : Uint256, length : Uint256){
        alloc_locals;
        let (stop) = uint256_eq(index, length);
        if (stop == 1){
          return ();
        }
        let (elem_loc) = ${arrayName}.read(loc, index);
        ${deleteCode.join('\n')}
        let (next_index, _) = uint256_add(index, ${(0, utils_2.uint256)(1)});
        return ${funcName}_elem(loc, next_index, length);
      }

      func ${funcName}(loc : felt){
        alloc_locals;
        let (length) = ${lengthName}.read(loc);
        ${lengthName}.write(loc, ${(0, utils_2.uint256)(0)});
        return ${funcName}_elem(loc, ${(0, utils_2.uint256)(0)}, length);
      }
    `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.UINT256_EQ),
            this.requireImport(...importPaths_1.UINT256_ADD),
            this.requireImport(...importPaths_1.U128_FROM_FELT),
        ];
        return {
            name: funcName,
            code: deleteFunc,
            functionsCalled: [...importedFuncs, dynArray, dynArrayLen, readFunc],
        };
    }
    deleteSmallStaticArray(type) {
        const funcName = `WS${this.getId()}_SMALL_STATIC_ARRAY_DELETE`;
        this.creatingFunctions.set(generateKey(type), funcName);
        (0, assert_1.default)(type.size !== undefined);
        const [deleteCode, funcCalls] = this.generateStaticArrayDeletionCode(type, type.elementT, (0, utils_1.narrowBigIntSafe)(type.size));
        const code = (0, endent_1.default) `
      func ${funcName}(loc: felt) {
        alloc_locals;
        ${deleteCode.join('\n')}
        return ();
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: funcCalls,
        };
    }
    deleteLargeStaticArray(type) {
        (0, assert_1.default)(type.size !== undefined);
        const funcName = `WS${this.getId()}_LARGE_STATIC_ARRAY_DELETE`;
        this.creatingFunctions.set(generateKey(type), funcName);
        const elementT = (0, solc_typed_ast_1.generalizeType)(type.elementT)[0];
        const elementTWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const storageReadFunc = this.storageReadGen.getOrCreateFuncDef(elementT);
        const auxDeleteFuncName = this.safeGetOrCreateFuncDef(type, elementT);
        const deleteCode = requiresReadBeforeRecursing(elementT)
            ? [`   let (elem_id) = ${storageReadFunc.name}(loc);`, `   ${auxDeleteFuncName}(elem_id);`]
            : [`    ${auxDeleteFuncName}(loc);`];
        const length = (0, utils_1.narrowBigIntSafe)(type.size);
        const nextLoc = (0, base_1.add)('loc', elementTWidth);
        const deleteFunc = (0, endent_1.default) `
      func ${funcName}_elem(loc : felt, index : felt){
        alloc_locals;
        if (index == ${length}){
          return ();
        }
        let next_index = index + 1;
        ${deleteCode.join('\n')}
        return ${funcName}_elem(${nextLoc}, next_index);
      }
      func ${funcName}(loc : felt){
        alloc_locals;
        return ${funcName}_elem(loc, 0);
      }
    `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.UINT256_EQ),
            this.requireImport(...importPaths_1.UINT256_SUB),
            this.requireImport(...importPaths_1.U128_FROM_FELT),
        ];
        return {
            name: funcName,
            code: deleteFunc,
            functionsCalled: [...importedFuncs, storageReadFunc],
        };
    }
    deleteStruct(type, structDef) {
        const funcName = `WS_STRUCT_${structDef.name}_DELETE`;
        this.creatingFunctions.set(generateKey(type), funcName);
        const [deleteCode, funcCalls] = this.generateStructDeletionCode(type, structDef.vMembers.map((varDecl) => (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, this.ast.inference)));
        const deleteFunc = (0, endent_1.default) `
      func ${funcName}(loc : felt){
        alloc_locals;
        ${deleteCode.join('\n')}
        return ();
      }
    `;
        return { name: funcName, code: deleteFunc, functionsCalled: funcCalls };
    }
    deleteNothing(type) {
        const funcName = 'WS_MAP_DELETE';
        this.creatingFunctions.set(generateKey(type), funcName);
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(loc: felt){
          return ();
        }
        `,
            functionsCalled: [],
        };
    }
    generateStructDeletionCode(structType, varDeclarations, index = 0, offset = 0) {
        if (index >= varDeclarations.length) {
            return [[], []];
        }
        const varType = (0, solc_typed_ast_1.generalizeType)(varDeclarations[index])[0];
        const varWidth = cairoTypeSystem_1.CairoType.fromSol(varType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const readIdFunc = this.storageReadGen.getOrCreateFuncDef(varType);
        const auxDeleteFuncName = this.safeGetOrCreateFuncDef(structType, varType);
        const deleteLoc = (0, base_1.add)('loc', offset);
        const deleteCode = requiresReadBeforeRecursing(varType)
            ? [
                `   let (elem_id) = ${readIdFunc.name}(${deleteLoc});`,
                `   ${auxDeleteFuncName}(elem_id);`,
            ]
            : [`    ${auxDeleteFuncName}(${deleteLoc});`];
        const [code, funcsCalled] = this.generateStructDeletionCode(structType, varDeclarations, index + 1, offset + varWidth);
        return [
            [...deleteCode, ...code],
            [readIdFunc, ...funcsCalled],
        ];
    }
    generateStaticArrayDeletionCode(arrayType, elementT, size) {
        const elementTWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const readIdFunc = this.storageReadGen.getOrCreateFuncDef(elementT);
        const auxDeleteFuncName = this.safeGetOrCreateFuncDef(arrayType, elementT);
        const generateDeleteCode = requiresReadBeforeRecursing(elementT)
            ? (deleteLoc) => [
                `   let (elem_id) = ${readIdFunc.name}(${deleteLoc});`,
                `   ${auxDeleteFuncName}(elem_id);`,
            ]
            : (deleteLoc) => [`    ${auxDeleteFuncName}(${deleteLoc});`];
        const generateCode = (index, offset) => {
            if (index === size) {
                return [];
            }
            const deleteLoc = (0, base_1.add)('loc', offset);
            const deleteCode = generateDeleteCode(deleteLoc);
            return [...deleteCode, ...generateCode(index + 1, offset + elementTWidth)];
        };
        return [generateCode(0, 0), requiresReadBeforeRecursing(elementT) ? [readIdFunc] : []];
    }
    processRecursiveDependencies() {
        [...this.functionDependencies.entries()].forEach(([key, dependencies]) => {
            if (!this.creatingFunctions.has(key)) {
                const generatedFunc = this.generatedFunctionsDef.get(key);
                (0, assert_1.default)(generatedFunc instanceof cairoNodes_1.CairoGeneratedFunctionDefinition);
                dependencies.forEach((otherKey) => {
                    const otherFunc = this.generatedFunctionsDef.get(otherKey);
                    if (otherFunc === undefined) {
                        (0, assert_1.default)(this.creatingFunctions.has(otherKey));
                        return;
                    }
                    generatedFunc.functionsCalled.push(otherFunc);
                });
            }
        });
    }
    getId() {
        return this.generatedFunctionsDef.size + this.creatingFunctions.size;
    }
}
exports.StorageDeleteGen = StorageDeleteGen;
function requiresReadBeforeRecursing(type) {
    return (0, nodeTypeProcessing_1.isDynamicArray)(type) || type instanceof solc_typed_ast_1.MappingType;
}
function generateKey(type) {
    return type.pp();
}
//# sourceMappingURL=storageDelete.js.map