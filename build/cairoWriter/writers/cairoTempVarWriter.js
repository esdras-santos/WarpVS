"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoTempVarWriter = void 0;
const base_1 = require("../base");
class CairoTempVarWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        return [`let ${node.name} = ${node.name};`];
    }
}
exports.CairoTempVarWriter = CairoTempVarWriter;
//# sourceMappingURL=cairoTempVarWriter.js.map