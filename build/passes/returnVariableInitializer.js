"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnVariableInitializer = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const cloning_1 = require("../utils/cloning");
const defaultValueNodes_1 = require("../utils/defaultValueNodes");
const functionGeneration_1 = require("../utils/functionGeneration");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
class ReturnVariableInitializer extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionDefinition(node, ast) {
        this.commonVisit(node, ast);
        const body = node.vBody;
        if (body === undefined)
            return;
        [...(0, functionGeneration_1.collectUnboundVariables)(body).entries()]
            .filter(([decl]) => node.vReturnParameters.vParameters.includes(decl))
            .forEach(([decl, identifiers]) => {
            const newDecl = (0, cloning_1.cloneASTNode)(decl, ast);
            const newDeclStatement = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', [newDecl.id], [newDecl], (0, defaultValueNodes_1.getDefaultValue)((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference), newDecl, ast));
            identifiers.forEach((identifier) => {
                identifier.referencedDeclaration = newDecl.id;
            });
            body.insertAtBeginning(newDeclStatement);
            ast.registerChild(newDeclStatement, body);
        });
    }
}
exports.ReturnVariableInitializer = ReturnVariableInitializer;
//# sourceMappingURL=returnVariableInitializer.js.map