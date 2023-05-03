"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakToReturn = void 0;
const mapper_1 = require("../../ast/mapper");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
class BreakToReturn extends mapper_1.ASTMapper {
    visitBreak(node, ast) {
        const containingFunction = (0, utils_1.getContainingFunction)(node);
        ast.replaceNode(node, (0, nodeTemplates_1.createReturn)(containingFunction.vParameters.vParameters, containingFunction.vReturnParameters.id, ast));
    }
}
exports.BreakToReturn = BreakToReturn;
//# sourceMappingURL=breakToReturn.js.map