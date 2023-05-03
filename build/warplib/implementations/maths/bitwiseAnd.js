"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseBitwiseAnd = void 0;
const utils_1 = require("../../utils");
function functionaliseBitwiseAnd(node, ast) {
    (0, utils_1.IntxIntFunction)(node, 'bitwise_and', 'only256', false, false, ast);
}
exports.functionaliseBitwiseAnd = functionaliseBitwiseAnd;
//# sourceMappingURL=bitwiseAnd.js.map