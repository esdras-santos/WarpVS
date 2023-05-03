"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoImportFunctionDefinitionWriter = void 0;
const base_1 = require("../base");
// Not being used as for now
class CairoImportFunctionDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        return [`use ${[...node.path, node.name].join('::')};`];
    }
}
exports.CairoImportFunctionDefinitionWriter = CairoImportFunctionDefinitionWriter;
//# sourceMappingURL=cairoImportFunctionDefinitionWriter.js.map