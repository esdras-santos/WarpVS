"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexAccessWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const base_1 = require("../base");
class IndexAccessWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        (0, assert_1.default)(node.vIndexExpression !== undefined);
        const baseWritten = writer.write(node.vBaseExpression);
        const indexWritten = writer.write(node.vIndexExpression);
        if ((0, nodeTypeProcessing_1.isDynamicCallDataArray)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, this.ast.inference))) {
            return [`${baseWritten}.ptr[${indexWritten}]`];
        }
        return [`${baseWritten}[${indexWritten}]`];
    }
}
exports.IndexAccessWriter = IndexAccessWriter;
//# sourceMappingURL=indexAccessWriter.js.map