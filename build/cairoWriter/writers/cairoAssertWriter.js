"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoAssertWriter = void 0;
const base_1 = require("../base");
class CairoAssertWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const expression = writer.write(node.vExpression);
        const message = node.assertMessage ?? 'Assertion error';
        return [`assert(${expression}, '${message}')`];
    }
}
exports.CairoAssertWriter = CairoAssertWriter;
//# sourceMappingURL=cairoAssertWriter.js.map