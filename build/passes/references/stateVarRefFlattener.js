"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateVarRefFlattener = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class StateVarRefFlattener extends mapper_1.ASTMapper {
    visitMemberAccess(node, ast) {
        if (node.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration &&
            node.vReferencedDeclaration.stateVariable) {
            ast.replaceNode(node, (0, nodeTemplates_1.createIdentifier)(node.vReferencedDeclaration, ast));
            return;
        }
        this.visitExpression(node, ast);
    }
}
exports.StateVarRefFlattener = StateVarRefFlattener;
//# sourceMappingURL=stateVarRefFlattener.js.map