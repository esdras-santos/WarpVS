"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const base_1 = require("../base");
const utils_1 = require("../utils");
class VariableDeclarationWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        if ((node.stateVariable || node.parent instanceof solc_typed_ast_1.SourceUnit) && (0, export_1.isCairoConstant)(node)) {
            (0, assert_1.default)(node.vValue !== undefined, 'Constant should have a defined value.');
            const constantValue = writer.write(node.vValue);
            return [[documentation, `const ${node.name} = ${constantValue};`].join('\n')];
        }
        return [node.name];
    }
}
exports.VariableDeclarationWriter = VariableDeclarationWriter;
//# sourceMappingURL=variableDeclarationWriter.js.map