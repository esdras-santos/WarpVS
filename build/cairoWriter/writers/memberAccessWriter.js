"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberAccessWriter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const base_1 = require("../base");
class MemberAccessWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        if (this.ast.inference.typeOf(node.vExpression) instanceof solc_typed_ast_1.TypeNameType) {
            return [`${writer.write(node.vExpression)}::${node.memberName}`];
        }
        else {
            return [`${writer.write(node.vExpression)}.${node.memberName}`];
        }
    }
}
exports.MemberAccessWriter = MemberAccessWriter;
//# sourceMappingURL=memberAccessWriter.js.map