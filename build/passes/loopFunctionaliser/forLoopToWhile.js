"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForLoopToWhile = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const cloning_1 = require("../../utils/cloning");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class ForLoopToWhile extends mapper_1.ASTMapper {
    visitForStatement(node, ast) {
        this.commonVisit(node, ast);
        const innerLoopStatements = node.vLoopExpression
            ? [node.vBody, node.vLoopExpression]
            : [node.vBody];
        // Handle the case where the loop condition is undefined in for statement
        // e.g. for (uint k = 0; ; k++)
        const loopCondition = node.vCondition ? node.vCondition : (0, nodeTemplates_1.createBoolLiteral)(true, ast);
        const replacementWhile = new solc_typed_ast_1.WhileStatement(ast.reserveId(), node.src, loopCondition, (0, nodeTemplates_1.createBlock)(innerLoopStatements, ast));
        const replacementId = ast.replaceNode(node, (0, nodeTemplates_1.createBlock)([replacementWhile], ast, node.documentation));
        if (node.vInitializationExpression !== undefined) {
            if (node.vInitializationExpression instanceof solc_typed_ast_1.VariableDeclarationStatement) {
                node.vInitializationExpression.vDeclarations.forEach((decl) => (decl.scope = replacementId));
            }
            ast.insertStatementBefore(replacementWhile, node.vInitializationExpression);
        }
    }
    visitContinue(node, ast) {
        const currentLoop = node.getClosestParentBySelector((n) => n instanceof solc_typed_ast_1.ForStatement || n instanceof solc_typed_ast_1.WhileStatement || n instanceof solc_typed_ast_1.DoWhileStatement);
        if (currentLoop instanceof solc_typed_ast_1.ForStatement && currentLoop.vLoopExpression) {
            ast.insertStatementBefore(node, (0, cloning_1.cloneASTNode)(currentLoop.vLoopExpression, ast));
        }
    }
}
exports.ForLoopToWhile = ForLoopToWhile;
//# sourceMappingURL=forLoopToWhile.js.map