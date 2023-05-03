"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationInitialiser = void 0;
const mapper_1 = require("../ast/mapper");
const defaultValueNodes_1 = require("../utils/defaultValueNodes");
const errors_1 = require("../utils/errors");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
class VariableDeclarationInitialiser extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitVariableDeclarationStatement(node, ast) {
        if (node.vInitialValue)
            return;
        // We assume the declaration list is only one long in the case it hasn't been initialised.
        // Tuple declarations must be initialised and the rhs cannot contain empty slots
        if (node.vDeclarations.length > 1) {
            throw new errors_1.TranspileFailedError("Can't instantiate multiple arguments");
        }
        const declaration = node.vDeclarations[0];
        if (!declaration.vType) {
            // This could be transpile failed because a previous pass didn't specify a type,
            throw new errors_1.TranspileFailedError('Please specify all types');
        }
        node.vInitialValue = (0, defaultValueNodes_1.getDefaultValue)((0, nodeTypeProcessing_1.safeGetNodeType)(declaration, ast.inference), declaration, ast);
        ast.registerChild(node.vInitialValue, node);
    }
}
exports.VariableDeclarationInitialiser = VariableDeclarationInitialiser;
//# sourceMappingURL=variableDeclarationInitialiser.js.map