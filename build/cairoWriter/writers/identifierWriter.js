"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifierWriter = void 0;
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const sourceUnitWriter_1 = require("./sourceUnitWriter");
class IdentifierWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _) {
        if ((0, utils_1.isCalldataDynArrayStruct)(node, this.ast.inference)) {
            // Calldata dynamic arrays have the element pointer and length variables
            // stored inside a struct. When the dynamic array is accessed, struct's members
            // must be used instead
            return [`${node.name}.len, ${node.name}.ptr`];
        }
        if ((0, utils_1.isExternalMemoryDynArray)(node, this.ast.inference)) {
            // Memory treated as calldata behaves similarly to calldata but it's
            // element pointer and length variables are not wrapped inside a struct.
            // When access to the dynamic array is needed, this two variables are used instead
            return [`${node.name}_len, ${node.name}`];
        }
        return [
            `${node.vReferencedDeclaration
                ? sourceUnitWriter_1.structRemappings.get(node.vReferencedDeclaration?.id) || node.name
                : node.name}`,
        ];
    }
}
exports.IdentifierWriter = IdentifierWriter;
//# sourceMappingURL=identifierWriter.js.map