"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingIndexAccessGen = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class MappingIndexAccessGen extends base_1.CairoUtilFuncGenBase {
    constructor(dynArrayGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.indexAccessFunctions = new Map();
        this.stringHashFunctions = new Map();
    }
    gen(node) {
        const base = node.vBaseExpression;
        let index = node.vIndexExpression;
        (0, assert_1.default)(index !== undefined);
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(base, this.ast.inference);
        (0, assert_1.default)(baseType instanceof solc_typed_ast_1.PointerType && baseType.to instanceof solc_typed_ast_1.MappingType);
        if ((0, nodeTypeProcessing_1.isReferenceType)(baseType.to.keyType)) {
            const [stringType, stringLoc] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(index, this.ast.inference));
            (0, assert_1.default)(stringLoc !== undefined);
            const stringHashFunc = this.getOrCreateStringHashFunction(stringType, stringLoc);
            index = (0, functionGeneration_1.createCallToFunction)(stringHashFunc, [index], this.ast, this.sourceUnit);
        }
        const funcDef = this.getOrCreateIndexAccessFunction(baseType.to.keyType, nodeType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [base, index], this.ast);
    }
    getOrCreateIndexAccessFunction(indexType, nodeType) {
        const indexKey = cairoTypeSystem_1.CairoType.fromSol(indexType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).fullStringRepresentation;
        const nodeKey = cairoTypeSystem_1.CairoType.fromSol(nodeType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).fullStringRepresentation;
        const key = indexKey + '-' + nodeKey;
        const existing = this.indexAccessFunctions.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.generateIndexAccess(indexType, nodeType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['name', (0, utils_1.typeNameFromTypeNode)(indexType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            [
                'index',
                (0, utils_1.typeNameFromTypeNode)(indexType, this.ast),
                (0, base_1.locationIfComplexType)(indexType, solc_typed_ast_1.DataLocation.Memory),
            ],
        ], [
            [
                'res',
                (0, utils_1.typeNameFromTypeNode)(nodeType, this.ast),
                (0, base_1.locationIfComplexType)(nodeType, solc_typed_ast_1.DataLocation.Storage),
            ],
        ], this.ast, this.sourceUnit);
        this.indexAccessFunctions.set(key, funcDef);
        return funcDef;
    }
    generateIndexAccess(indexType, valueType) {
        const indexCairoType = cairoTypeSystem_1.CairoType.fromSol(indexType, this.ast);
        const valueCairoType = cairoTypeSystem_1.CairoType.fromSol(valueType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const identifier = this.indexAccessFunctions.size;
        const funcName = `WS_INDEX_${indexCairoType.typeName}_to_${valueCairoType.typeName}${identifier}`;
        const mappingName = `WARP_MAPPING${identifier}`;
        const indexTypeString = indexCairoType.toString();
        const mappingFuncInfo = {
            name: mappingName,
            code: `${mappingName}: LegacyMap::<(felt252, ${indexTypeString}), felt252>`,
            functionsCalled: [],
        };
        const mappingFunc = (0, functionGeneration_1.createCairoGeneratedFunction)(mappingFuncInfo, [
            ['name', (0, nodeTemplates_1.createUintNTypeName)(248, this.ast)],
            ['index', (0, utils_1.typeNameFromTypeNode)(indexType, this.ast)],
        ], [], this.ast, this.sourceUnit, { stubKind: export_1.FunctionStubKind.StorageDefStub });
        return {
            name: funcName,
            code: (0, endent_1.default) `
        fn ${funcName}(name: felt252, index: ${indexCairoType}) -> felt252 {
          let existing = ${mappingName}::read((name, index));
          if existing == 0 {
            let used = WARP_USED_STORAGE::read();
            ${mappingName}::write((name, index), used);
            return used;
          }
          return existing;
        }
      `,
            functionsCalled: [mappingFunc],
        };
    }
    getOrCreateStringHashFunction(indexType, dataLocation) {
        (0, assert_1.default)(dataLocation !== solc_typed_ast_1.DataLocation.Default);
        const key = indexType.pp() + dataLocation;
        const existing = this.stringHashFunctions.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const indexTypeName = (0, utils_1.typeNameFromTypeNode)(indexType, this.ast);
        const inputInfo = [['str', indexTypeName, dataLocation]];
        const outputInfo = [
            ['hashed_str', (0, nodeTemplates_1.createUint8TypeName)(this.ast), solc_typed_ast_1.DataLocation.Default],
        ];
        if (dataLocation === solc_typed_ast_1.DataLocation.CallData) {
            const importFunction = this.ast.registerImport(this.sourceUnit, ...importPaths_1.STRING_HASH, inputInfo, outputInfo);
            return importFunction;
        }
        if (dataLocation === solc_typed_ast_1.DataLocation.Memory) {
            const importFunction = this.ast.registerImport(this.sourceUnit, ...importPaths_1.STRING_HASH, inputInfo, outputInfo);
            return importFunction;
        }
        // Datalocation is storage
        const funcInfo = this.generateStringHashFunction(indexType);
        const genFunc = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, inputInfo, outputInfo, this.ast, this.sourceUnit);
        this.stringHashFunctions.set(key, genFunc);
        return genFunc;
    }
    generateStringHashFunction(indexType) {
        (0, assert_1.default)((0, nodeTypeProcessing_1.isDynamicArray)(indexType));
        const elemenT = (0, nodeTypeProcessing_1.getElementType)(indexType);
        const [dynArray, dynArrayLen] = this.dynArrayGen.getOrCreateFuncDef(elemenT);
        const arrayName = dynArray.name;
        const lenName = dynArrayLen.name;
        const funcName = `WS_STRING_HASH${this.stringHashFunctions.size}`;
        const helperFuncName = `WS_TO_FELT_ARRAY${this.stringHashFunctions.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
          fn ${helperFuncName}(name: felt252, ref result_array: Array::<felt252>, index: u256, len: u256){
            if index == len {
              return;
            }
            let loc = ${arrayName}::read(name, index);
            let value = WARP_STORAGE::read(loc);
            result_array.append(value);
            return ${helperFuncName}(name, ref result_array, index + 1, len);
          }
          fn ${funcName}(name: felt252) -> felt252 {
            let len: u256 = ${lenName}::read(name);
            let mut result_array = ArrayTrait::new();
            ${helperFuncName}(name, ref result_array, 0, len);
            return string_hash(len, result_array);
          }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.ARRAY_TRAIT),
                this.requireImport(...importPaths_1.STRING_HASH),
                dynArray,
                dynArrayLen,
            ],
        };
    }
}
exports.MappingIndexAccessGen = MappingIndexAccessGen;
//# sourceMappingURL=mappingIndexAccess.js.map