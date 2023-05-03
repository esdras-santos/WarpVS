"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStorageVariables = void 0;
const cloning_1 = require("../../utils/cloning");
const utils_1 = require("./utils");
function addStorageVariables(node, idRemapping, ast) {
    const dynamicAllocations = node.dynamicStorageAllocations;
    const staticAllocations = node.staticStorageAllocations;
    let usedStorage = node.usedStorage;
    let usedIds = node.usedIds;
    (0, utils_1.getBaseContracts)(node)
        .reverse()
        .forEach((base) => {
        base.dynamicStorageAllocations.forEach((allocation, variable) => {
            const newVariable = (0, cloning_1.cloneASTNode)(variable, ast);
            idRemapping.set(variable.id, newVariable);
            newVariable.scope = node.id;
            node.insertAtBeginning(newVariable);
            dynamicAllocations.set(newVariable, allocation + usedIds);
        });
        base.staticStorageAllocations.forEach((allocation, variable) => {
            const newVariable = (0, cloning_1.cloneASTNode)(variable, ast);
            idRemapping.set(variable.id, newVariable);
            newVariable.scope = node.id;
            node.insertAtBeginning(newVariable);
            staticAllocations.set(newVariable, allocation + usedStorage);
        });
        usedStorage += base.usedStorage;
        usedIds += base.usedIds;
    });
    node.usedStorage = usedStorage;
    node.usedIds = usedIds;
}
exports.addStorageVariables = addStorageVariables;
//# sourceMappingURL=storageVariablesInheritance.js.map