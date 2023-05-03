"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayIndexAccessGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class DynArrayIndexAccessGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
    }
    gen(node) {
        const base = node.vBaseExpression;
        const index = node.vIndexExpression;
        (0, assert_1.default)(index !== undefined);
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(base, this.ast.inference);
        (0, assert_1.default)(baseType instanceof solc_typed_ast_1.PointerType && (0, nodeTypeProcessing_1.isDynamicArray)(baseType.to));
        const funcDef = this.getOrCreateFuncDef(nodeType, baseType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [base, index], this.ast);
    }
    getOrCreateFuncDef(nodeType, baseType) {
        const nodeCairoType = cairoTypeSystem_1.CairoType.fromSol(nodeType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const key = nodeCairoType.fullStringRepresentation;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(nodeType, nodeCairoType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', (0, utils_1.typeNameFromTypeNode)(baseType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['offset', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
        ], [['res_loc', (0, utils_1.typeNameFromTypeNode)(nodeType, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(valueType, valueCairoType) {
        const [arrayDef, arrayLength] = this.dynArrayGen.getOrCreateFuncDef(valueType);
        const arrayName = arrayDef.name;
        const lengthName = arrayLength.name;
        const funcName = `${arrayName}_IDX`;
        return {
            name: funcName,
            code: [
                `func ${funcName}{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr : felt}(ref: felt, index: Uint256) -> (res: felt){`,
                `    alloc_locals;`,
                `    let (length) = ${lengthName}.read(ref);`,
                `    let (inRange) = uint256_lt(index, length);`,
                `    assert inRange = 1;`,
                `    let (existing) = ${arrayName}.read(ref, index);`,
                `    if (existing == 0){`,
                `        let (used) = WARP_USED_STORAGE.read();`,
                `        WARP_USED_STORAGE.write(used + ${valueCairoType.width});`,
                `        ${arrayName}.write(ref, index, used);`,
                `        return (used,);`,
                `    }else{`,
                `        return (existing,);`,
                `    }`,
                `}`,
            ].join('\n'),
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_LT),
                arrayDef,
                arrayLength,
            ],
        };
    }
}
exports.DynArrayIndexAccessGen = DynArrayIndexAccessGen;
//# sourceMappingURL=dynArrayIndexAccess.js.map