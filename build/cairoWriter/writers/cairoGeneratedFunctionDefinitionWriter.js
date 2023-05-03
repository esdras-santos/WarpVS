"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoGeneratedFunctionDefinitionWriter = void 0;
const base_1 = require("../base");
class CairoGeneratedFunctionDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        return [node.rawStringDefinition];
    }
}
exports.CairoGeneratedFunctionDefinitionWriter = CairoGeneratedFunctionDefinitionWriter;
//# sourceMappingURL=cairoGeneratedFunctionDefinitionWriter.js.map