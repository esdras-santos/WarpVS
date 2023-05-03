"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryOperationWriter = void 0;
const base_1 = require("../base");
class BinaryOperationWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const args = [node.vLeftExpression, node.vRightExpression].map((v) => writer.write(v));
        return [`${args[0]} ${node.operator} ${args[1]}`];
    }
}
exports.BinaryOperationWriter = BinaryOperationWriter;
//# sourceMappingURL=binaryOperationWriter.js.map