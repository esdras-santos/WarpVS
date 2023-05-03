"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionPruner = void 0;
const mapper_1 = require("../../ast/mapper");
const callGraph_1 = require("./callGraph");
const functionRemover_1 = require("./functionRemover");
// The purpose of this pass is to remove all functions in the code that are not accessible
// from any of the externally visible functions and thus just clutter the code.
class FunctionPruner extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // Storage Allocator handles the initialization of state variables inside
            // constructors, which is needed because to build the call-graph it is
            // assumed that all FunctionCalls belong to a FunctionDefinition
            'Sa',
            // UnreachableStatementPruner removes statements from the code, which could be
            // function calls, so FunctionPruner pass should happen after to not include them.
            'Us',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            // CallGraphBuilder generates a directed graph that represents calls between functions.
            // It starts with the set of externally visible functions of the contract.
            // Therefore, if a function definition does not appear in this graph, it means that it
            // is not accessible from that set, and thus, can be removed.
            const graph = new callGraph_1.CallGraphBuilder();
            graph.dispatchVisit(root, ast);
            // FunctionRemover handles the deletion of function definitions from the AST,
            // using the graph that was previously generated
            new functionRemover_1.FunctionRemover(graph.getFunctionGraph()).dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.FunctionPruner = FunctionPruner;
//# sourceMappingURL=index.js.map