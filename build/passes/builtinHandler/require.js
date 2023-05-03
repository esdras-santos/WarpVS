"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Require = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const mapper_1 = require("../../ast/mapper");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class Require extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitExpressionStatement(node, ast) {
        const expressionNode = node.vExpression;
        const cairoAssert = this.requireToCairoAssert(expressionNode, ast);
        if (cairoAssert === null) {
            this.commonVisit(node, ast);
            return;
        }
        // Since the cairoAssert is not null, we have a require/revert/assert function call at hand
        (0, assert_1.default)(expressionNode instanceof solc_typed_ast_1.FunctionCall);
        ast.replaceNode(node, cairoAssert);
    }
    visitReturn(node, ast) {
        const expressionNode = node.vExpression;
        const cairoAssert = this.requireToCairoAssert(expressionNode, ast);
        if (cairoAssert === null)
            return;
        ast.insertStatementBefore(node, cairoAssert);
        node.vExpression = undefined;
    }
    requireToCairoAssert(expression, ast) {
        if (!(expression instanceof solc_typed_ast_1.FunctionCall))
            return null;
        if (expression.vFunctionCallType !== solc_typed_ast_1.ExternalReferenceType.Builtin) {
            return null;
        }
        if (expression.vIdentifier === 'require' || expression.vIdentifier === 'assert') {
            const requireMessage = expression.vArguments[1] instanceof solc_typed_ast_1.Literal ? expression.vArguments[1].value : null;
            return new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), expression.src, new cairoNodes_1.CairoAssert(ast.reserveId(), expression.src, expression.vArguments[0], requireMessage, expression.raw));
        }
        else if (expression.vIdentifier === 'revert') {
            const revertMessage = expression.vArguments[0] instanceof solc_typed_ast_1.Literal ? expression.vArguments[0].value : null;
            return new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), expression.src, new cairoNodes_1.CairoAssert(ast.reserveId(), expression.src, (0, nodeTemplates_1.createBoolLiteral)(false, ast), revertMessage, expression.raw));
        }
        return null;
    }
}
exports.Require = Require;
//# sourceMappingURL=require.js.map