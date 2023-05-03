"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFunctionItems = void 0;
function getFunctionItems(abi) {
    const result = [];
    abi.forEach((item) => {
        if (item.type === 'function' && item.name !== '__default__') {
            result.push(item);
        }
    });
    return result;
}
exports.getFunctionItems = getFunctionItems;
//# sourceMappingURL=func.js.map