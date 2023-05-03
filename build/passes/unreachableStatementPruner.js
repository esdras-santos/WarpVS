"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnreachableStatementPruner = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const controlFlowAnalyser_1 = require("../utils/controlFlowAnalyser");
const utils_1 = require("../utils/utils");
class UnreachableStatementPruner extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.reachableStatements = new Set();
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionDefinition(node, ast) {
        const body = node.vBody;
        if (body === undefined)
            return;
        this.reachableStatements = (0, utils_1.union)(this.reachableStatements, (0, controlFlowAnalyser_1.collectReachableStatements)(body));
        this.commonVisit(node, ast);
    }
    visitStatement(node, ast) {
        const containingFunction = node.getClosestParentByType(solc_typed_ast_1.FunctionDefinition);
        if (containingFunction === undefined)
            return;
        const containingBlock = node.getClosestParentByType(solc_typed_ast_1.StatementWithChildren);
        if (containingBlock === undefined)
            return;
        if (!this.reachableStatements.has(node)) {
            containingBlock.removeChild(node);
        }
        else {
            this.commonVisit(node, ast);
        }
    }
}
exports.UnreachableStatementPruner = UnreachableStatementPruner;
//# sourceMappingURL=unreachableStatementPruner.js.map