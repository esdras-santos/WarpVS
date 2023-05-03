"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.solveLibraryInheritance = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const utils_1 = require("./utils");
function solveLibraryInheritance(node, ast) {
    const libraryIds = collectAllLibrariesId(ast);
    node.linearizedBaseContracts.push(...getLibrariesInInheritanceLine(node, libraryIds));
}
exports.solveLibraryInheritance = solveLibraryInheritance;
function getLibrariesInInheritanceLine(node, libraryIds) {
    const libraries = new Set();
    (0, utils_1.getBaseContracts)(node).forEach((contract) => contract.linearizedBaseContracts
        .filter((id) => !node.linearizedBaseContracts.includes(id))
        .forEach((contractId) => {
        (0, assert_1.default)(libraryIds.has(contractId), `Contract #${contractId} should be a library`);
        libraries.add(contractId);
    }));
    return libraries;
}
function collectAllLibrariesId(ast) {
    const librariesById = new Set();
    ast.context.map.forEach((astNode, id) => {
        if (astNode instanceof solc_typed_ast_1.ContractDefinition && astNode.kind === solc_typed_ast_1.ContractKind.Library)
            librariesById.add(id);
    });
    return librariesById;
}
//# sourceMappingURL=libraryInheritance.js.map