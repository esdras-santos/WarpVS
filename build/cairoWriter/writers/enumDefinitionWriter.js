"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumDefinitionWriter = void 0;
const base_1 = require("../base");
class EnumDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(_node, _writer) {
        // EnumDefinition nodes do not need to be printed because they
        // would have already been replaced by integer literals
        return [``];
    }
}
exports.EnumDefinitionWriter = EnumDefinitionWriter;
//# sourceMappingURL=enumDefinitionWriter.js.map