"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const base_1 = require("../base");
class AssignmentWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        (0, assert_1.default)(node.operator === '=', `Unexpected operator ${node.operator}`);
        const [lhs, rhs] = [node.vLeftHandSide, node.vRightHandSide];
        const nodes = [lhs, rhs].map((v) => writer.write(v));
        return [`let ${nodes[0]} ${node.operator} ${nodes[1]};`];
    }
}
exports.AssignmentWriter = AssignmentWriter;
//# sourceMappingURL=assignmentWriter.js.map