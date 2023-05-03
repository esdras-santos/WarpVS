"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicStateVarsGetterGenerator = void 0;
const mapper_1 = require("../../ast/mapper");
const fixFnCallRef_1 = require("./fixFnCallRef");
const gettersGenerator_1 = require("./gettersGenerator");
class PublicStateVarsGetterGenerator extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        const getterFunctions = new Map();
        // Build up a map of all getter definitions across all files
        ast.roots.forEach((root) => {
            new gettersGenerator_1.GettersGenerator(getterFunctions).dispatchVisit(root, ast);
        });
        // Change all getter calls to reference the new functions
        ast.roots.forEach((root) => {
            new fixFnCallRef_1.FixFnCallRef(getterFunctions).dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.PublicStateVarsGetterGenerator = PublicStateVarsGetterGenerator;
//# sourceMappingURL=index.js.map