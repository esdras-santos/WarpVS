"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsgSender = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class MsgSender extends mapper_1.ASTMapper {
    visitMemberAccess(node, ast) {
        if (node.vExpression instanceof solc_typed_ast_1.Identifier &&
            node.vExpression.name === 'msg' &&
            node.vExpression.vIdentifierType === solc_typed_ast_1.ExternalReferenceType.Builtin &&
            node.memberName === 'sender') {
            const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ...importPaths_1.GET_CALLER_ADDRESS, [], [['address', (0, nodeTemplates_1.createAddressTypeName)(false, ast)]]), [], ast);
            ast.replaceNode(node, replacementCall);
        }
        // Fine to recurse because there is a check that the member access is a Builtin. Therefor a.msg.sender should
        // not be picked up.
        this.visitExpression(node, ast);
    }
}
exports.MsgSender = MsgSender;
//# sourceMappingURL=msgSender.js.map