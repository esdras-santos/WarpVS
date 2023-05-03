"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceUnitSplitter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const path_1 = require("path");
const mapper_1 = require("../ast/mapper");
const cloning_1 = require("../utils/cloning");
const nameModifiers_1 = require("../utils/nameModifiers");
class SourceUnitSplitter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast.roots = ast.roots.flatMap((su) => splitSourceUnit(su, ast));
        return ast;
    }
}
exports.SourceUnitSplitter = SourceUnitSplitter;
function splitSourceUnit(sourceUnit, ast) {
    const freeSourceUnitId = ast.reserveId();
    const freeSourceSignificantChildren = [
        ...sourceUnit.vEnums,
        ...sourceUnit.vErrors,
        ...sourceUnit.vUserDefinedValueTypes,
        ...updateScope(sourceUnit.vFunctions, freeSourceUnitId),
        ...updateScope(sourceUnit.vVariables, freeSourceUnitId),
        ...updateScope(sourceUnit.vStructs, freeSourceUnitId),
    ];
    const freeSourceChildren = [
        ...sourceUnit.vImportDirectives.map((id) => (0, cloning_1.cloneASTNode)(id, ast)),
        ...freeSourceSignificantChildren,
    ];
    const freeSourceUnit = new solc_typed_ast_1.SourceUnit(freeSourceUnitId, sourceUnit.src, '', 0, mangleFreeFilePath(sourceUnit.absolutePath), sourceUnit.exportedSymbols, freeSourceChildren);
    const units = sourceUnit.vContracts.map((contract) => {
        const contractSourceUnitId = ast.reserveId();
        return new solc_typed_ast_1.SourceUnit(contractSourceUnitId, '', '', 0, mangleContractFilePath(sourceUnit.absolutePath, contract.name, '.cairo'), sourceUnit.exportedSymbols, [
            ...sourceUnit.vImportDirectives.map((iD) => (0, cloning_1.cloneASTNode)(iD, ast)),
            ...updateScope([contract], contractSourceUnitId),
        ]);
    });
    const sourceUnits = freeSourceSignificantChildren.length > 0 ? [freeSourceUnit, ...units] : units;
    sourceUnits.forEach((su) => ast.setContextRecursive(su));
    sourceUnits.forEach((su) => sourceUnits
        .filter((isu) => isu.id !== su.id)
        .forEach((importSu) => {
        const iDir = new solc_typed_ast_1.ImportDirective(ast.reserveId(), importSu.src, importSu.absolutePath, importSu.absolutePath, '', getAllSourceUnitDefinitions(importSu).map((node) => ({
            foreign: node.id,
            local: node.name,
        })), su.id, importSu.id);
        su.insertAtBeginning(iDir);
        ast.registerChild(iDir, su);
        //ImportDirective scope should point to current SourceUnit
        importSu.getChildrenByType(solc_typed_ast_1.ImportDirective).forEach((IDNode) => {
            IDNode.scope = importSu.id;
        });
    }));
    return sourceUnits;
}
function updateScope(nodes, newScope) {
    nodes.forEach((node) => (node.scope = newScope));
    return nodes;
}
function mangleFreeFilePath(path) {
    return (0, path_1.join)(path, nameModifiers_1.FREE_FILE_NAME);
}
function mangleContractFilePath(path, contractName, extension) {
    return (0, path_1.join)(path, 'src', contractName + extension);
}
function getAllSourceUnitDefinitions(sourceUnit) {
    return [
        ...sourceUnit.vContracts,
        ...sourceUnit.vStructs,
        ...sourceUnit.vVariables,
        ...sourceUnit.vFunctions,
        ...sourceUnit.vVariables,
        ...sourceUnit.vUserDefinedValueTypes,
        ...sourceUnit.vEnums,
        ...sourceUnit.vErrors,
    ];
}
//# sourceMappingURL=sourceUnitSplitter.js.map