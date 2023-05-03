"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseBitwiseOr = void 0;
const utils_1 = require("../../utils");
function functionaliseBitwiseOr(node, ast) {
    (0, utils_1.IntxIntFunction)(node, 'bitwise_or', 'only256', false, false, ast);
}
exports.functionaliseBitwiseOr = functionaliseBitwiseOr;
//# sourceMappingURL=bitwiseOr.js.map