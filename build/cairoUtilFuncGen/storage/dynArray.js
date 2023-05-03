"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const base_1 = require("../base");
class DynArrayGen extends base_1.StringIndexedFuncGen {
    genLength(node, arrayType) {
        const [_dynArray, dynArrayLength] = this.getOrCreateFuncDef((0, export_1.getElementType)(arrayType));
        return (0, export_1.createCallToFunction)(dynArrayLength, [node.vExpression], this.ast);
    }
    // TODO: keep using storage vars as functions feels odd now
    getOrCreateFuncDef(type) {
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const key = cairoType.fullStringRepresentation;
        const lengthKey = key + '_LENGTH';
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            const existingLength = this.generatedFunctionsDef.get(lengthKey);
            (0, assert_1.default)(existingLength !== undefined);
            return [existing, existingLength];
        }
        const [arrayInfo, lengthInfo] = this.getOrCreate(cairoType);
        const dynArray = (0, export_1.createCairoGeneratedFunction)(arrayInfo, [
            ['name', (0, export_1.createUintNTypeName)(248, this.ast)],
            ['index', (0, export_1.createUint256TypeName)(this.ast)],
        ], [['res_loc', (0, export_1.createUintNTypeName)(248, this.ast)]], this.ast, this.sourceUnit, {
            mutability: solc_typed_ast_1.FunctionStateMutability.View,
            stubKind: export_1.FunctionStubKind.StorageDefStub,
        });
        const dynArrayLength = (0, export_1.createCairoGeneratedFunction)(lengthInfo, [['name', (0, export_1.createUintNTypeName)(248, this.ast)]], [['length', (0, export_1.createUint256TypeName)(this.ast)]], this.ast, this.sourceUnit, {
            mutability: solc_typed_ast_1.FunctionStateMutability.View,
            stubKind: export_1.FunctionStubKind.StorageDefStub,
        });
        this.generatedFunctionsDef.set(key, dynArray);
        this.generatedFunctionsDef.set(lengthKey, dynArrayLength);
        return [dynArray, dynArrayLength];
    }
    getOrCreate(valueCairoType) {
        const mappingName = `WARP_DARRAY${this.generatedFunctionsDef.size}_${valueCairoType.typeName}`;
        const funcInfo = {
            name: mappingName,
            code: `${mappingName}: LegacyMap::<(felt252, u256), felt252>`,
            functionsCalled: [],
        };
        const lengthFuncInfo = {
            name: `${mappingName}_LENGTH`,
            code: `${mappingName}_LENGTH: LegacyMap::<felt252, u256>`,
            functionsCalled: [],
        };
        return [funcInfo, lengthFuncInfo];
    }
}
exports.DynArrayGen = DynArrayGen;
//# sourceMappingURL=dynArray.js.map