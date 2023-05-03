"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionRemover = void 0;
const assert_1 = __importDefault(require("assert"));
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
const utils_1 = require("../../utils/utils");
class FunctionRemover extends mapper_1.ASTMapper {
    constructor(graph) {
        super();
        this.functionGraph = graph;
        this.reachableFunctions = new Set();
    }
    visitSourceUnit(node, ast) {
        node.vFunctions.filter((func) => (0, utils_1.isExternallyVisible)(func)).forEach((func) => this.dfs(func));
        node.vContracts.forEach((c) => this.visitContractDefinition(c, ast));
        node.vFunctions
            .filter((func) => !this.reachableFunctions.has(func.id))
            .forEach((func) => node.removeChild(func));
    }
    visitContractDefinition(node, _ast) {
        // Collect visible functions and obtain ids of all reachable functions
        node.vFunctions.filter((func) => (0, utils_1.isExternallyVisible)(func)).forEach((func) => this.dfs(func));
        // Remove unreachable functions
        node.vFunctions
            .filter((func) => !this.reachableFunctions.has(func.id))
            .forEach((func) => node.removeChild(func));
    }
    dfs(f) {
        this.reachableFunctions.add(f.id);
        const functions = this.functionGraph.get(f.id);
        (0, assert_1.default)(functions !== undefined, `Function ${(0, astPrinter_1.printNode)(f)} was not added to the functionGraph`);
        functions.forEach((f) => {
            if (!this.reachableFunctions.has(f.id))
                this.dfs(f);
        });
    }
}
exports.FunctionRemover = FunctionRemover;
//# sourceMappingURL=functionRemover.js.map