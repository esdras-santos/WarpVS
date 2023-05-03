"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopFunctionaliser = void 0;
const mapper_1 = require("../../ast/mapper");
const breakToReturn_1 = require("./breakToReturn");
const continueToLoopCall_1 = require("./continueToLoopCall");
const forLoopToWhile_1 = require("./forLoopToWhile");
const returnToBreak_1 = require("./returnToBreak");
const whileLoopToFunction_1 = require("./whileLoopToFunction");
class LoopFunctionaliser extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        const loopFnCounter = { count: 0 };
        ast.roots.forEach((root) => {
            const loopToContinueFunction = new Map();
            new forLoopToWhile_1.ForLoopToWhile().dispatchVisit(root, ast);
            new returnToBreak_1.ReturnToBreak().dispatchVisit(root, ast);
            new whileLoopToFunction_1.WhileLoopToFunction(loopToContinueFunction, loopFnCounter).dispatchVisit(root, ast);
            new breakToReturn_1.BreakToReturn().dispatchVisit(root, ast);
            new continueToLoopCall_1.ContinueToLoopCall(loopToContinueFunction).dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.LoopFunctionaliser = LoopFunctionaliser;
//# sourceMappingURL=index.js.map