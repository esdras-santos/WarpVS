"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierRemover = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
/*  Once functions with modifiers are processed, the code of each modifier invoked
    has been inlined in its corresponding function; modifiers are not used anywhere
    else. Therefore, ModifierDefinition nodes are removed in order to simplify
    further passes on the ast, as they are no longer needed.
*/
class ModifierRemover extends mapper_1.ASTMapper {
    visitModifierDefinition(node, _ast) {
        const parent = node.getClosestParentByType(solc_typed_ast_1.ContractDefinition);
        assert(parent !== undefined, `Unable to find parent of ${(0, astPrinter_1.printNode)(node)}`);
        parent.removeChild(node);
    }
}
exports.ModifierRemover = ModifierRemover;
//# sourceMappingURL=modifierRemover.js.map