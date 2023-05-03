"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDefinitionWriter = void 0;
const base_1 = require("../base");
const utils_1 = require("../utils");
class EventDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        const args = writer.write(node.vParameters);
        return [[documentation, `// #[event]`, `// fn ${node.name}(${args}) {}`].join('\n')];
    }
}
exports.EventDefinitionWriter = EventDefinitionWriter;
//# sourceMappingURL=eventDefinitionWriter.js.map