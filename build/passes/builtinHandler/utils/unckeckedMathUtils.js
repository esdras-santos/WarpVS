"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseUncheckedSub = exports.functionaliseUncheckedAdd = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const utils_1 = require("../../../utils/utils");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const assert_1 = __importDefault(require("assert"));
const astPrinter_1 = require("../../../utils/astPrinter");
const utils_2 = require("../../../warplib/utils");
function functionaliseUncheckedAdd(node, ast) {
    IntxIntUncheckedFunction(node, 'add', ast);
}
exports.functionaliseUncheckedAdd = functionaliseUncheckedAdd;
function functionaliseUncheckedSub(node, ast) {
    IntxIntUncheckedFunction(node, 'sub', ast);
}
exports.functionaliseUncheckedSub = functionaliseUncheckedSub;
function IntxIntUncheckedFunction(node, name, ast) {
    const lhsType = (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference), ast);
    const rhsType = (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference), ast);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(retType instanceof solc_typed_ast_1.IntType || retType instanceof solc_typed_ast_1.FixedBytesType, `${(0, astPrinter_1.printNode)(node)} has type ${(0, astPrinter_1.printTypeNode)(retType)}, which is not compatible with ${name}`);
    const width = (0, utils_2.getIntOrFixedByteBitWidth)(retType);
    const fullName = [
        'u',
        `${width}`,
        `_overflow${width === 256 && name === 'sub' ? '' : `ing`}`,
        `_${name}`,
    ].join('');
    const importName = ['integer'];
    const importedFunc = ast.registerImport(node, importName, fullName, [
        ['lhs', lhsType],
        ['rhs', rhsType],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.typeString}, ${node.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
//# sourceMappingURL=unckeckedMathUtils.js.map