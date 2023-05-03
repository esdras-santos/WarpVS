"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageStaticArrayIndexAccessGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class StorageStaticArrayIndexAccessGen extends base_1.StringIndexedFuncGen {
    gen(node) {
        (0, assert_1.default)(node.vIndexExpression !== undefined);
        const arrayType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, this.ast.inference);
        (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.PointerType &&
            arrayType.to instanceof solc_typed_ast_1.ArrayType &&
            arrayType.to.size !== undefined);
        const valueType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(arrayType, valueType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [
            node.vBaseExpression,
            node.vIndexExpression,
            (0, nodeTemplates_1.createNumberLiteral)(cairoTypeSystem_1.CairoType.fromSol(valueType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width, this.ast, 'uint256'),
            (0, nodeTemplates_1.createNumberLiteral)(arrayType.to.size, this.ast, 'uint256'),
        ], this.ast);
    }
    getOrCreateFuncDef(arrayType, valueType) {
        const key = arrayType.pp() + valueType.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate();
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', (0, utils_1.typeNameFromTypeNode)(arrayType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['index', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
            ['size', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
            ['limit', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
        ], [['res_loc', (0, utils_1.typeNameFromTypeNode)(valueType, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate() {
        return {
            name: 'WS0_IDX',
            code: [
                `func WS0_IDX{range_check_ptr}(loc: felt, index: Uint256, size: Uint256, limit: Uint256) -> (resLoc: felt){`,
                `    alloc_locals;`,
                `    let (inRange) = uint256_lt(index, limit);`,
                `    assert inRange = 1;`,
                `    let (locHigh, locLow) = split_felt(loc);`,
                `    let (offset, overflow) = uint256_mul(index, size);`,
                `    assert overflow.low = 0;`,
                `    assert overflow.high = 0;`,
                `    let (res256, carry) = uint256_add(Uint256(locLow, locHigh), offset);`,
                `    assert carry = 0;`,
                `    let (feltLimitHigh, feltLimitLow) = split_felt(-1);`,
                `    let (narrowable) = uint256_le(res256, Uint256(feltLimitLow, feltLimitHigh));`,
                `    assert narrowable = 1;`,
                `    return (res256.low + 2**128 * res256.high,);`,
                `}`,
            ].join('\n'),
            functionsCalled: [
                this.requireImport(...importPaths_1.SPLIT_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                this.requireImport(...importPaths_1.UINT256_LE),
                this.requireImport(...importPaths_1.UINT256_LT),
                this.requireImport(...importPaths_1.UINT256_MUL),
            ],
        };
    }
}
exports.StorageStaticArrayIndexAccessGen = StorageStaticArrayIndexAccessGen;
//# sourceMappingURL=staticArrayIndexAccess.js.map