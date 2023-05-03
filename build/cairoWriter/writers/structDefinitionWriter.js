"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructDefinitionWriter = void 0;
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const utils_2 = require("../utils");
class StructDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        return [
            [
                `struct ${(0, utils_1.mangleStructName)(node)}{`,
                ...node.vMembers
                    .map((value) => `${value.name} : ${cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.safeGetNodeType)(value, this.ast.inference), this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation)},`)
                    .map((v) => utils_2.INDENT + v),
                `}`,
            ].join('\n'),
        ];
    }
}
exports.StructDefinitionWriter = StructDefinitionWriter;
//# sourceMappingURL=structDefinitionWriter.js.map