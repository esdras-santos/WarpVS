"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotImplementedWriter = void 0;
const astPrinter_1 = require("../../utils/astPrinter");
const base_1 = require("../base");
class NotImplementedWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _) {
        this.logNotImplemented(`${node.type} to cairo not implemented yet (found at ${(0, astPrinter_1.printNode)(node)})`);
        return [``];
    }
}
exports.NotImplementedWriter = NotImplementedWriter;
//# sourceMappingURL=notImplementedWriter.js.map