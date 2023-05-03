"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
const mapper_1 = require("../ast/mapper");
const export_1 = require("../export");
/**
 * Generates a cairo function that emits an event
 * through a cairo syscall. Then replace the emit statement
 * with a call to the generated function.
 */
class Events extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'Abi', // Abi pass is needed to encode the arguments
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitEmitStatement(node, ast) {
        const replacement = ast
            .getUtilFuncGen(node)
            .events.event.gen(node, node.vEventCall.vReferencedDeclaration);
        ast.replaceNode(node, (0, export_1.createExpressionStatement)(ast, replacement));
        this.commonVisit(node, ast);
    }
}
exports.Events = Events;
//# sourceMappingURL=events.js.map