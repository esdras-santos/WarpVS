"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferencedLibraries = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
// Library calls in solidity are delegate calls
// i.e  libraries can be seen as implicit base contracts of the contracts that use them
// The pass converts external call to a library to an internal call to it
// by adding the referenced Libraries in the `FunctionCall` to the
// linearizedBaselist of a contract/Library.
class ReferencedLibraries extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // FreeFunctionInliner handles free functions that make library calls
            'Ffi',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        // Collect all library nodes and their ids in the map 'librariesById'
        const librariesById = new Map();
        ast.context.map.forEach((astNode, id) => {
            if (astNode instanceof solc_typed_ast_1.ContractDefinition && astNode.kind === solc_typed_ast_1.ContractKind.Library) {
                librariesById.set(id, astNode);
            }
        });
        ast.roots.forEach((root) => new LibraryHandler(librariesById).dispatchVisit(root, ast));
        return ast;
    }
}
exports.ReferencedLibraries = ReferencedLibraries;
class LibraryHandler extends mapper_1.ASTMapper {
    constructor(libraries) {
        super();
        this.librariesById = libraries;
    }
    visitFunctionCall(node, ast) {
        if (node.vExpression instanceof solc_typed_ast_1.MemberAccess) {
            const calledDeclaration = node.vReferencedDeclaration;
            if (calledDeclaration === undefined)
                return this.commonVisit(node, ast);
            // Free functions calling library functions are not yet supported.
            // The previous pass handles inlining those functions, so they can be ignored here.
            const parent = node.getClosestParentByType(solc_typed_ast_1.ContractDefinition);
            if (parent === undefined)
                return;
            // Checks if the calledDeclaration is a referenced Library declaration,
            // if yes add it to the linearizedBaseContract list of parent ContractDefinition node.
            const library = findFunctionInLibrary(calledDeclaration.id, this.librariesById);
            if (library !== undefined) {
                getLibrariesToInherit(library, this.librariesById).forEach((id) => {
                    if (!parent.linearizedBaseContracts.includes(id)) {
                        parent.linearizedBaseContracts.push(id);
                    }
                });
            }
        }
        this.commonVisit(node, ast);
    }
}
function findFunctionInLibrary(functionId, librariesById) {
    for (const library of librariesById.values()) {
        if (library.vFunctions.some((f) => f.id === functionId))
            return library;
    }
    return undefined;
}
function getLibrariesToInherit(calledLibrary, librariesById) {
    const ids = [];
    getAllLibraries(calledLibrary, librariesById, ids);
    return ids;
}
function getAllLibraries(calledLibrary, librariesById, ids) {
    ids.push(calledLibrary.id);
    calledLibrary
        .getChildren()
        .filter((child) => child instanceof solc_typed_ast_1.FunctionCall && child.vExpression instanceof solc_typed_ast_1.MemberAccess)
        .forEach((functionCallInCalledLibrary) => {
        (0, assert_1.default)(functionCallInCalledLibrary.vExpression instanceof solc_typed_ast_1.MemberAccess);
        const calledFuncId = functionCallInCalledLibrary.vExpression.referencedDeclaration;
        const library = findFunctionInLibrary(calledFuncId, librariesById);
        if (library !== undefined && !ids.includes(library.id))
            getAllLibraries(library, librariesById, ids);
    });
}
//# sourceMappingURL=referencedLibraries.js.map