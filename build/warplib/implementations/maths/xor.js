"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseXor = void 0;
const utils_1 = require("../../utils");
function functionaliseXor(node, ast) {
    (0, utils_1.IntxIntFunction)(node, 'xor', 'only256', false, false, ast);
}
exports.functionaliseXor = functionaliseXor;
//# sourceMappingURL=xor.js.map