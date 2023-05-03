"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleType = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
class ModuleType extends solc_typed_ast_1.TypeNode {
    constructor(path, src) {
        super(src);
        this.path = path;
    }
    pp() {
        return `module "${this.path}"`;
    }
}
exports.ModuleType = ModuleType;
//# sourceMappingURL=moduleType.js.map