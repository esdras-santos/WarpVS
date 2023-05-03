"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSizeInfo = exports.AbiBase = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class AbiBase extends base_1.StringIndexedFuncGenWithAuxiliar {
    constructor() {
        super(...arguments);
        this.functionName = 'not_implemented';
    }
    gen(expressions) {
        const exprTypes = expressions.map((expr) => (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(expr, this.ast.inference))[0]);
        const generatedFunction = this.getOrCreateFuncDef(exprTypes);
        return (0, functionGeneration_1.createCallToFunction)(generatedFunction, expressions, this.ast);
    }
    getOrCreateFuncDef(types) {
        const key = types.map((t) => t.pp()).join(',');
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const genFuncInfo = this.getOrCreate(types);
        const functionStub = (0, functionGeneration_1.createCairoGeneratedFunction)(genFuncInfo, types.map((exprT, index) => (0, nodeTypeProcessing_1.isValueType)(exprT)
            ? [`param${index}`, (0, utils_1.typeNameFromTypeNode)(exprT, this.ast)]
            : [`param${index}`, (0, utils_1.typeNameFromTypeNode)(exprT, this.ast), solc_typed_ast_1.DataLocation.Memory]), [['result', (0, nodeTemplates_1.createBytesTypeName)(this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, functionStub);
        return functionStub;
    }
    getOrCreate(_types) {
        throw new Error('Method not implemented.');
    }
    getOrCreateEncoding(_type) {
        throw new Error('Method not implemented.');
    }
}
exports.AbiBase = AbiBase;
/**
 * Returns a static array type string without the element
 * information
 * e.g.
 *    uint8[20] -> uint8[]
 *    uint[][8] -> uint[][]
 *    uint[10][15] -> uint[10][]
 *  @param type a static ArrayType
 *  @returns static array without length information
 */
function removeSizeInfo(type) {
    (0, assert_1.default)(type.size !== undefined, 'Expected an ArrayType with known size (a solc static array)');
    const typeString = type
        .pp()
        .split(/(\[[0-9]*\])/)
        .filter((s) => s !== '');
    return [...typeString.slice(0, typeString.length - 1), '[]'].join('');
}
exports.removeSizeInfo = removeSizeInfo;
//# sourceMappingURL=base.js.map