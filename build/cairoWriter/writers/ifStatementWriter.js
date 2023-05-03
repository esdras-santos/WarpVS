"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IfStatementWriter = void 0;
const export_1 = require("../../export");
const base_1 = require("../base");
const utils_1 = require("../utils");
class IfStatementWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        return [
            [
                documentation,
                `if ${writer.write(node.vCondition)} {`,
                writer.write(node.vTrueBody),
                ...(node.vFalseBody ? ['} else {', writer.write(node.vFalseBody)] : []),
                '}',
            ]
                .filter(export_1.notUndefined)
                .flat()
                .join('\n'),
        ];
    }
}
exports.IfStatementWriter = IfStatementWriter;
//# sourceMappingURL=ifStatementWriter.js.map