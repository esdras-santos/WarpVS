"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalArgModifier = void 0;
const mapper_1 = require("../../ast/mapper");
const dynamicArrayModifier_1 = require("./dynamicArrayModifier");
const memoryRefInputModifier_1 = require("./memoryRefInputModifier");
class ExternalArgModifier extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast = memoryRefInputModifier_1.RefTypeModifier.map(ast);
        ast = dynamicArrayModifier_1.DynArrayModifier.map(ast);
        return ast;
    }
}
exports.ExternalArgModifier = ExternalArgModifier;
//# sourceMappingURL=index.js.map