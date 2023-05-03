"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgBoundChecker = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
class ArgBoundChecker extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitContractDefinition(node, ast) {
        if (node.kind === solc_typed_ast_1.ContractKind.Interface) {
            return;
        }
        this.commonVisit(node, ast);
    }
    visitFunctionDefinition(node, ast) {
        this.commonVisit(node, ast);
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
    }
}
exports.ArgBoundChecker = ArgBoundChecker;
//# sourceMappingURL=argBoundChecker.js.map