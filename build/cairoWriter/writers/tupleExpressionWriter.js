"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleExpressionWriter = void 0;
const base_1 = require("../base");
class TupleExpressionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        return [`(${node.vComponents.map((value) => writer.write(value)).join(', ')})`];
    }
}
exports.TupleExpressionWriter = TupleExpressionWriter;
//# sourceMappingURL=tupleExpressionWriter.js.map