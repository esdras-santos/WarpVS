"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayPopGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class DynArrayPopGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageDelete, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageDelete = storageDelete;
    }
    gen(pop) {
        (0, assert_1.default)(pop.vExpression instanceof solc_typed_ast_1.MemberAccess);
        const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(pop.vExpression.vExpression, this.ast.inference))[0];
        (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.ArrayType ||
            arrayType instanceof solc_typed_ast_1.BytesType ||
            arrayType instanceof solc_typed_ast_1.StringType);
        const funcDef = this.getOrCreateFuncDef(arrayType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [pop.vExpression.vExpression], this.ast);
    }
    getOrCreateFuncDef(arrayType) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(arrayType);
        const cairoElementType = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const key = cairoElementType.fullStringRepresentation;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(elementT);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, utils_1.typeNameFromTypeNode)(arrayType, this.ast), solc_typed_ast_1.DataLocation.Storage]], [], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(elementType) {
        const deleteFunc = this.storageDelete.getOrCreateFuncDef(elementType);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementType);
        const arrayName = dynArray.name;
        const lengthName = dynArrayLength.name;
        const getElemLoc = (0, nodeTypeProcessing_1.isDynamicArray)(elementType) || (0, nodeTypeProcessing_1.isMapping)(elementType)
            ? [
                `let (elem_loc) = ${arrayName}.read(loc, newLen);`,
                `let (elem_loc) = readId(elem_loc);`,
            ].join('\n')
            : `let (elem_loc) = ${arrayName}.read(loc, newLen);`;
        const funcName = `${arrayName}_POP`;
        return {
            name: funcName,
            code: [
                `func ${funcName}{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr : felt}(loc: felt) -> (){`,
                `    alloc_locals;`,
                `    let (len) = ${lengthName}.read(loc);`,
                `    let (isEmpty) = uint256_eq(len, Uint256(0,0));`,
                `    assert isEmpty = 0;`,
                `    let (newLen) = uint256_sub(len, Uint256(1,0));`,
                `    ${lengthName}.write(loc, newLen);`,
                `    ${getElemLoc}`,
                `    return ${deleteFunc.name}(elem_loc);`,
                `}`,
            ].join('\n'),
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_EQ),
                this.requireImport(...importPaths_1.UINT256_SUB),
                deleteFunc,
                dynArray,
                dynArrayLength,
            ],
        };
    }
}
exports.DynArrayPopGen = DynArrayPopGen;
//# sourceMappingURL=dynArrayPop.js.map