"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPrivateSuperFunctions = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cloning_1 = require("../../utils/cloning");
const utils_1 = require("../../utils/utils");
const utils_2 = require("./utils");
// Every function from every base contract gets included privately in the derived contract
// To prevent name collisions, these functions have "_sX" appended
function addPrivateSuperFunctions(node, idRemapping, idRemappingOverriders, ast) {
    const currentFunctions = new Map();
    // collect functions in the current contract
    node.vFunctions
        .filter((f) => f.kind !== solc_typed_ast_1.FunctionKind.Constructor)
        .forEach((f) => currentFunctions.set(f.name, f));
    (0, utils_2.getBaseContracts)(node).forEach((base, depth) => {
        base.vFunctions
            .filter((func) => func.kind !== solc_typed_ast_1.FunctionKind.Constructor &&
            (node.kind === solc_typed_ast_1.ContractKind.Interface ? (0, utils_1.isExternallyVisible)(func) : true))
            .map((func) => {
            const existingEntry = currentFunctions.get(func.name);
            const clonedFunction = (0, cloning_1.cloneASTNode)(func, ast);
            idRemapping.set(func.id, clonedFunction);
            clonedFunction.scope = node.id;
            if (existingEntry !== undefined) {
                idRemappingOverriders.set(func.id, existingEntry);
                // We don't want to inherit the fallback function if an override exists because there can be no explicit references to it.
                if (clonedFunction.kind === solc_typed_ast_1.FunctionKind.Fallback) {
                    return null;
                }
                clonedFunction.visibility = solc_typed_ast_1.FunctionVisibility.Private;
                clonedFunction.name = `s${depth + 1}_${clonedFunction.name}`;
            }
            else {
                currentFunctions.set(func.name, clonedFunction);
                idRemappingOverriders.set(func.id, clonedFunction);
                //Add recursion here for recursive function calls
                idRemappingOverriders.set(clonedFunction.id, clonedFunction);
            }
            return clonedFunction;
        })
            // filter the nulls returned when trying to inherit overridden fallback functions
            .filter((f) => f !== null)
            .forEach((func) => {
            node.appendChild(func);
            (0, utils_2.fixSuperReference)(func, base, node);
        });
    });
}
exports.addPrivateSuperFunctions = addPrivateSuperFunctions;
//# sourceMappingURL=functionInheritance.js.map