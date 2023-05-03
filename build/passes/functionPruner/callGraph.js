"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallGraphBuilder = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
class CallGraphBuilder extends mapper_1.ASTMapper {
    constructor() {
        super();
        this.callGraph = new Map();
        this.functionId = new Map();
        this.currentFunction = undefined;
    }
    visitFunctionDefinition(node, ast) {
        this.currentFunction = node;
        this.functionId.set(node.id, node);
        this.callGraph.set(node.id, new Set());
        this.commonVisit(node, ast);
        this.currentFunction = undefined;
    }
    visitCairoGeneratedFunctionDefinition(node, ast) {
        this.currentFunction = node;
        this.functionId.set(node.id, node);
        this.callGraph.set(node.id, new Set(node.functionsCalled.map((funcDef) => funcDef.id)));
        node.functionsCalled.forEach((funcDef) => this.commonVisit(funcDef, ast));
        this.currentFunction = undefined;
    }
    visitFunctionCall(node, ast) {
        (0, assert_1.default)(this.currentFunction !== undefined, `Function Call ${(0, astPrinter_1.printNode)(node)} outside FunctionDefinition`);
        const existingCalls = this.callGraph.get(this.currentFunction.id);
        (0, assert_1.default)(existingCalls !== undefined, `${(0, astPrinter_1.printNode)(this.currentFunction)} should have been added to the map`);
        const refFunc = node.vReferencedDeclaration;
        if (refFunc instanceof solc_typed_ast_1.FunctionDefinition) {
            existingCalls.add(refFunc.id);
            this.callGraph.set(this.currentFunction.id, existingCalls);
        }
        this.commonVisit(node, ast);
    }
    // Returns the call-graph with the actual functions nodes instead of its ids
    getFunctionGraph() {
        return new Map([...this.callGraph].map(([funcId, callFuncs]) => {
            // If the callFunction id was not added to functionId map (undefined is returned) it
            // means it is an external function call, so it can be ignored
            const functions = [...callFuncs]
                .map((id) => this.functionId.get(id))
                .filter((func) => func !== undefined);
            return [funcId, functions];
        }));
    }
}
exports.CallGraphBuilder = CallGraphBuilder;
//# sourceMappingURL=callGraph.js.map