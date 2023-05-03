"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnWriter = void 0;
const base_1 = require("../base");
const utils_1 = require("../utils");
class ReturnWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        const returns = node.vExpression ? writer.write(node.vExpression) : '()';
        return [[documentation, `return ${returns};`].join('\n')];
    }
}
exports.ReturnWriter = ReturnWriter;
//# sourceMappingURL=returnWriter.js.map