"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockWriter = void 0;
const base_1 = require("../base");
const utils_1 = require("../utils");
class BlockWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        return [
            [
                documentation,
                node.vStatements
                    .map((value) => writer.write(value))
                    .map((v) => v
                    .split('\n')
                    .map((line) => utils_1.INDENT + line)
                    .join('\n'))
                    .join('\n'),
            ].join('\n'),
        ];
    }
}
exports.BlockWriter = BlockWriter;
//# sourceMappingURL=blockWriter.js.map