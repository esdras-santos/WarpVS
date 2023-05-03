"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnInserter = void 0;
const mapper_1 = require("../ast/mapper");
const controlFlowAnalyser_1 = require("../utils/controlFlowAnalyser");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const utils_1 = require("../utils/utils");
class ReturnInserter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionDefinition(node, ast) {
        if (node.vBody === undefined)
            return;
        if ((0, controlFlowAnalyser_1.hasPathWithoutReturn)(node.vBody)) {
            const retVars = node.vReturnParameters.vParameters;
            let expression;
            if (retVars.length !== 0) {
                expression = (0, utils_1.toSingleExpression)(retVars.map((r) => (0, nodeTemplates_1.createIdentifier)(r, ast)), ast);
            }
            const newReturn = (0, nodeTemplates_1.createReturn)(expression, node.vReturnParameters.id, ast);
            node.vBody.appendChild(newReturn);
            ast.registerChild(newReturn, node.vBody);
        }
    }
}
exports.ReturnInserter = ReturnInserter;
//# sourceMappingURL=returnInserter.js.map