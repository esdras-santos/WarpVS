"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierHandler = void 0;
const functionModifierHandler_1 = require("./functionModifierHandler");
const mapper_1 = require("../../ast/mapper");
const modifierRemover_1 = require("./modifierRemover");
/*  This pass takes all functions that are being modified and transform
    them into a sequence of functions, which are called in the same order
    the modifier invocations were declared. Each of these functions will
    contain the code of the corresponding modifier.
    
    Once this is done, ModifierDefinition nodes are removed from the ast
    since they are no longer needed.
*/
class ModifierHandler extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            new functionModifierHandler_1.FunctionModifierHandler().dispatchVisit(root, ast);
            new modifierRemover_1.ModifierRemover().dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.ModifierHandler = ModifierHandler;
//# sourceMappingURL=index.js.map