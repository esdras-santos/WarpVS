"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementaryTypeNameExpressionWriter = void 0;
const base_1 = require("../base");
class ElementaryTypeNameExpressionWriter extends base_1.CairoASTNodeWriter {
    writeInner(_node, _writer) {
        // ElementaryTypeNameExpressions left in the tree by this point
        // are unreferenced expressions, and that this needs to work without
        // ineffectual statement handling
        return ['0'];
    }
}
exports.ElementaryTypeNameExpressionWriter = ElementaryTypeNameExpressionWriter;
//# sourceMappingURL=elementaryTypeNameExpressionWriter.js.map