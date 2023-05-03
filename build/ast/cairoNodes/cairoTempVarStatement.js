"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoTempVarStatement = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
class CairoTempVarStatement extends solc_typed_ast_1.Statement {
    constructor(id, src, name, documentation, raw) {
        super(id, src, documentation, raw);
        this.name = name;
    }
}
exports.CairoTempVarStatement = CairoTempVarStatement;
//# sourceMappingURL=cairoTempVarStatement.js.map