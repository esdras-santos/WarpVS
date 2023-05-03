"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleFlattener = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const errors_1 = require("../../utils/errors");
class TupleFlattener extends mapper_1.ASTMapper {
    visitTupleExpression(node, ast) {
        if (node.parent instanceof solc_typed_ast_1.TupleExpression &&
            node.parent.isInlineArray === false &&
            node.isInlineArray === false) {
            throw new errors_1.WillNotSupportError('Nested Tuple References not Supported');
        }
        if (node.vOriginalComponents.length === 1 &&
            node.vOriginalComponents[0] !== null &&
            node.vOriginalComponents[0].typeString === node.typeString &&
            !node.isInlineArray) {
            const parent = node.parent;
            ast.replaceNode(node, node.vOriginalComponents[0], parent);
            this.dispatchVisit(node.vOriginalComponents[0], ast);
        }
        else {
            this.visitExpression(node, ast);
        }
    }
}
exports.TupleFlattener = TupleFlattener;
//# sourceMappingURL=tupleFlattener.js.map