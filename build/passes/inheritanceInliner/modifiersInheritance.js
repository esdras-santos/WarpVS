"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNonOverriddenModifiers = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cloning_1 = require("../../utils/cloning");
const utils_1 = require("./utils");
function addNonOverriddenModifiers(node, idRemapping, idRemappingOverriders, ast) {
    const currentModifiers = new Map();
    node.vModifiers.forEach((modifier) => currentModifiers.set(modifier.name, modifier));
    (0, utils_1.getBaseContracts)(node)
        .filter((node) => node.kind !== solc_typed_ast_1.ContractKind.Library)
        .forEach((contract) => {
        contract.vModifiers.forEach((modifier, depth) => {
            const existingModifier = currentModifiers.get(modifier.name);
            const clonedModifier = (0, cloning_1.cloneASTNode)(modifier, ast);
            idRemapping.set(modifier.id, clonedModifier);
            if (existingModifier === undefined) {
                currentModifiers.set(modifier.name, clonedModifier);
                idRemappingOverriders.set(modifier.id, clonedModifier);
            }
            else {
                clonedModifier.name = `m${depth + 1}_${clonedModifier.name}`;
                idRemappingOverriders.set(modifier.id, existingModifier);
            }
            node.appendChild(clonedModifier);
            (0, utils_1.fixSuperReference)(clonedModifier, contract, node);
        });
    });
}
exports.addNonOverriddenModifiers = addNonOverriddenModifiers;
//# sourceMappingURL=modifiersInheritance.js.map