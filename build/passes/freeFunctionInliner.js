"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeFunctionInliner = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const cloning_1 = require("../utils/cloning");
const utils_1 = require("../utils/utils");
/*
  Library calls in solidity are delegate calls
  i.e  libraries can be seen as implicit base contracts of the contracts that use them
  The ReferencedLibraries pass converts external call to the library to internal call
  to it.
  This pass is called before the ReferencedLibraries pass to inline free functions
  into the contract if the free functions make library calls or if they call other free
  function which do that.
*/
class FreeFunctionInliner extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.funcCounter = 0;
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitContractDefinition(node, ast) {
        // Stores old FunctionDefinition and cloned FunctionDefinition
        const remappings = new Map();
        // Visit all FunctionCalls in a Contract and check if they call
        // free functions that call Library Functions
        node
            .getChildrenByType(solc_typed_ast_1.FunctionCall)
            .map((fCall) => fCall.vReferencedDeclaration)
            .filter((definition) => definition instanceof solc_typed_ast_1.FunctionDefinition && definition.kind === solc_typed_ast_1.FunctionKind.Free)
            .map((freeFunc) => getFunctionsToInline(freeFunc))
            .reduce(utils_1.union, new Set())
            .forEach((funcToInline) => {
            const clonedFunction = (0, cloning_1.cloneASTNode)(funcToInline, ast);
            clonedFunction.name = `f${this.funcCounter++}_${clonedFunction.name}`;
            clonedFunction.visibility = solc_typed_ast_1.FunctionVisibility.Internal;
            clonedFunction.scope = node.id;
            clonedFunction.kind = solc_typed_ast_1.FunctionKind.Function;
            node.appendChild(clonedFunction);
            remappings.set(funcToInline, clonedFunction);
            // Added for recursive calls
            remappings.set(clonedFunction, clonedFunction);
        });
        updateReferencedDeclarations(node, remappings);
    }
}
exports.FreeFunctionInliner = FreeFunctionInliner;
// Checks the given free function for library calls, and recurses through any free functions it calls
// to see if any of them call libraries. All functions reachable from func that call library functions
// directly or indirectly are returned to be inlined
function getFunctionsToInline(func, visited = new Set()) {
    const funcsToInline = func
        .getChildrenByType(solc_typed_ast_1.FunctionCall)
        .map((fCall) => fCall.vReferencedDeclaration)
        .filter((def) => def instanceof solc_typed_ast_1.FunctionDefinition && def.kind === solc_typed_ast_1.FunctionKind.Free && !visited.has(def))
        .map((freeFunc) => getFunctionsToInline(freeFunc, new Set([func, ...visited])))
        .reduce(utils_1.union, new Set());
    funcsToInline.add(func);
    return funcsToInline;
}
function updateReferencedDeclarations(node, remappingIds) {
    node.walkChildren((node) => {
        if (node instanceof solc_typed_ast_1.Identifier) {
            if (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition) {
                const remapping = remappingIds.get(node.vReferencedDeclaration);
                if (remapping !== undefined) {
                    node.referencedDeclaration = remapping.id;
                    node.name = remapping.name;
                }
            }
        }
    });
}
//# sourceMappingURL=freeFunctionInliner.js.map