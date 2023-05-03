"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionStatementWriter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const base_1 = require("../base");
const utils_1 = require("../utils");
class ExpressionStatementWriter extends base_1.CairoASTNodeWriter {
    constructor() {
        super(...arguments);
        this.newVarCounter = 0;
    }
    writeInner(node, writer) {
        const documentation = (0, utils_1.getDocumentation)(node.documentation, writer);
        if ((node.vExpression instanceof solc_typed_ast_1.FunctionCall &&
            node.vExpression.kind !== solc_typed_ast_1.FunctionCallKind.StructConstructorCall) ||
            node.vExpression instanceof solc_typed_ast_1.Assignment ||
            node.vExpression instanceof cairoNodes_1.CairoAssert) {
            return [[documentation, `${writer.write(node.vExpression)};`].join('\n')];
        }
        else {
            return [
                [
                    documentation,
                    `let __warp_uv${this.newVarCounter++} = ${writer.write(node.vExpression)};`,
                ].join('\n'),
            ];
        }
    }
}
exports.ExpressionStatementWriter = ExpressionStatementWriter;
//# sourceMappingURL=expressionStatementWriter.js.map