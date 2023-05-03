"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierMangler = void 0;
const mapper_1 = require("../../ast/mapper");
const declarationNameMangler_1 = require("./declarationNameMangler");
const expressionNameMangler_1 = require("./expressionNameMangler");
class IdentifierMangler extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast = declarationNameMangler_1.DeclarationNameMangler.map(ast);
        ast = expressionNameMangler_1.ExpressionNameMangler.map(ast);
        return ast;
    }
}
exports.IdentifierMangler = IdentifierMangler;
//# sourceMappingURL=index.js.map