"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionNameMangler = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
class ExpressionNameMangler extends mapper_1.ASTMapper {
    visitUserDefinedTypeName(node, ast) {
        if (node.vReferencedDeclaration instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition ||
            node.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition) {
            node.name = node.vReferencedDeclaration.name;
        }
        this.commonVisit(node, ast);
    }
    visitIdentifier(node, _ast) {
        if (node.vIdentifierType === solc_typed_ast_1.ExternalReferenceType.UserDefined &&
            (node.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration ||
                (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition &&
                    !(node.parent instanceof solc_typed_ast_1.ImportDirective)))) {
            node.name = node.vReferencedDeclaration.name;
        }
    }
    visitMemberAccess(node, ast) {
        this.commonVisit(node, ast);
        const declaration = node.vReferencedDeclaration;
        if (declaration === undefined) {
            // No declaration means this is a solidity internal identifier
            return;
        }
        else if (declaration instanceof solc_typed_ast_1.FunctionDefinition ||
            declaration instanceof solc_typed_ast_1.VariableDeclaration ||
            declaration instanceof solc_typed_ast_1.EnumValue) {
            node.memberName = declaration.name;
        }
    }
}
exports.ExpressionNameMangler = ExpressionNameMangler;
//# sourceMappingURL=expressionNameMangler.js.map