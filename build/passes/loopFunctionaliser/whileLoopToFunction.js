"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhileLoopToFunction = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const utils_1 = require("./utils");
class WhileLoopToFunction extends mapper_1.ASTMapper {
    constructor(loopToContinueFunction, loopFnCounter) {
        super();
        this.loopToContinueFunction = loopToContinueFunction;
        this.loopFnCounter = loopFnCounter;
    }
    loopToFunction(node, ast) {
        // Visit innermost loops first
        this.commonVisit(node, ast);
        const loopExtractionFn = node instanceof solc_typed_ast_1.DoWhileStatement ? utils_1.extractDoWhileToFunction : utils_1.extractWhileToFunction;
        const unboundVariables = new Map([...(0, functionGeneration_1.collectUnboundVariables)(node).entries()].filter(([decl]) => !decl.stateVariable));
        const functionDef = loopExtractionFn(node, [...unboundVariables.keys()], this.loopToContinueFunction, ast, this.loopFnCounter.count++);
        const outerCall = (0, functionGeneration_1.createOuterCall)(node, [...unboundVariables.keys()], (0, utils_1.createLoopCall)(functionDef, [...unboundVariables.keys()], ast), ast);
        ast.replaceNode(node, outerCall);
    }
    visitWhileStatement(node, ast) {
        this.loopToFunction(node, ast);
    }
    visitDoWhileStatement(node, ast) {
        this.loopToFunction(node, ast);
    }
}
exports.WhileLoopToFunction = WhileLoopToFunction;
//# sourceMappingURL=whileLoopToFunction.js.map