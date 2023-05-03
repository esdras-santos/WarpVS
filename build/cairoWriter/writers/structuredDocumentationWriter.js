"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredDocumentationWriter = void 0;
const base_1 = require("../base");
class StructuredDocumentationWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        return [`// ${node.text.split('\n').join('\n//')}`];
    }
}
exports.StructuredDocumentationWriter = StructuredDocumentationWriter;
//# sourceMappingURL=structuredDocumentationWriter.js.map