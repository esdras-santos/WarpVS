"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmitStatementWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const base_1 = require("../base");
const utils_1 = require("../utils");
class EmitStatementWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const eventDef = node.vEventCall.vReferencedDeclaration;
        (0, assert_1.default)(eventDef instanceof solc_typed_ast_1.EventDefinition, `Expected EventDefinition as referenced type`);
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        const args = node.vEventCall.vArguments.map((v) => writer.write(v)).join(', ');
        return [[documentation, `${eventDef.name}.emit(${args});`].join('\n')];
    }
}
exports.EmitStatementWriter = EmitStatementWriter;
//# sourceMappingURL=emitStatementWriter.js.map