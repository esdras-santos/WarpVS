"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicFunctionSplitter = void 0;
const publicFunctionCallModifier_1 = require("./publicFunctionCallModifier");
const externalFunctionCreator_1 = require("./externalFunctionCreator");
const mapper_1 = require("../../ast/mapper");
const internalFunctionCallCollector_1 = require("./internalFunctionCallCollector");
class PublicFunctionSplitter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        const internalFunctionCallSet = new Set();
        ast.roots.forEach((root) => new internalFunctionCallCollector_1.InternalFunctionCallCollector(internalFunctionCallSet).dispatchVisit(root, ast));
        const internalToExternalFunctionMap = new Map();
        ast.roots.forEach((root) => new externalFunctionCreator_1.ExternalFunctionCreator(internalToExternalFunctionMap, internalFunctionCallSet).dispatchVisit(root, ast));
        ast.roots.forEach((root) => new publicFunctionCallModifier_1.PublicFunctionCallModifier(internalToExternalFunctionMap).dispatchVisit(root, ast));
        return ast;
    }
}
exports.PublicFunctionSplitter = PublicFunctionSplitter;
//# sourceMappingURL=index.js.map