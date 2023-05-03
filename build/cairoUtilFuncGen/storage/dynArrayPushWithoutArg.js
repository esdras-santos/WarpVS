"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayPushWithoutArgGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class DynArrayPushWithoutArgGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
    }
    gen(push) {
        (0, assert_1.default)(push.vExpression instanceof solc_typed_ast_1.MemberAccess);
        const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(push.vExpression.vExpression, this.ast.inference))[0];
        (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.ArrayType || arrayType instanceof solc_typed_ast_1.BytesType, `Pushing without args to a non array: ${(0, export_1.printTypeNode)(arrayType)}`);
        const funcDef = this.getOrCreateFuncDef(arrayType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [push.vExpression.vExpression], this.ast);
    }
    getOrCreateFuncDef(arrayType) {
        const elementType = (0, nodeTypeProcessing_1.getElementType)(arrayType);
        const cairoElementType = cairoTypeSystem_1.CairoType.fromSol(elementType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const key = elementType.pp(); //cairoElementType.fullStringRepresentation;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(elementType, cairoElementType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, utils_1.typeNameFromTypeNode)(arrayType, this.ast), solc_typed_ast_1.DataLocation.Storage]], [['new_elem_loc', (0, utils_1.typeNameFromTypeNode)(elementType, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(elementType, cairoElementType) {
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementType);
        const arrayName = dynArray.name;
        const lengthName = dynArrayLength.name;
        const funcName = `${arrayName}_PUSH`;
        return {
            name: funcName,
            code: [
                `func ${funcName}{syscall_ptr : felt*, pedersen_ptr : HashBuiltin*, range_check_ptr : felt}(loc: felt) -> (newElemLoc: felt){`,
                `    alloc_locals;`,
                `    let (len) = ${lengthName}.read(loc);`,
                `    let (newLen, carry) = uint256_add(len, Uint256(1,0));`,
                `    assert carry = 0;`,
                `    ${lengthName}.write(loc, newLen);`,
                `    let (existing) = ${arrayName}.read(loc, len);`,
                `    if ((existing) == 0){`,
                `        let (used) = WARP_USED_STORAGE.read();`,
                `        WARP_USED_STORAGE.write(used + ${cairoElementType.width});`,
                `        ${arrayName}.write(loc, len, used);`,
                `        return (used,);`,
                `    }else{`,
                `        return (existing,);`,
                `    }`,
                `}`,
            ].join('\n'),
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                dynArray,
                dynArrayLength,
            ],
        };
    }
}
exports.DynArrayPushWithoutArgGen = DynArrayPushWithoutArgGen;
//# sourceMappingURL=dynArrayPushWithoutArg.js.map