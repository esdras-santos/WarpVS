"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstantHandler = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const cloning_1 = require("../utils/cloning");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const implicitConversionToExplicit_1 = require("./implicitConversionToExplicit");
class ConstantHandler extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    isConstant(node) {
        return (node.mutability === solc_typed_ast_1.Mutability.Constant &&
            (node.vValue instanceof solc_typed_ast_1.Literal || node.vValue instanceof solc_typed_ast_1.MemberAccess));
    }
    inlineConstant(node, ast) {
        const referencedDeclaration = node.vReferencedDeclaration;
        if (!(referencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration &&
            referencedDeclaration.vValue &&
            this.isConstant(referencedDeclaration))) {
            return;
        }
        const constant = (0, cloning_1.cloneASTNode)(referencedDeclaration.vValue, ast);
        const typeTo = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        ast.replaceNode(node, constant);
        (0, implicitConversionToExplicit_1.insertConversionIfNecessary)(constant, typeTo, constant, ast);
    }
    visitIdentifier(node, ast) {
        this.inlineConstant(node, ast);
    }
    visitMemberAccess(node, ast) {
        this.inlineConstant(node, ast);
    }
}
exports.ConstantHandler = ConstantHandler;
//# sourceMappingURL=constantHandler.js.map