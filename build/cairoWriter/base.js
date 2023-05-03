"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoASTNodeWriter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../utils/errors");
class CairoASTNodeWriter extends solc_typed_ast_1.ASTNodeWriter {
    constructor(ast, throwOnUnimplemented) {
        super();
        this.ast = ast;
        this.throwOnUnimplemented = throwOnUnimplemented;
    }
    logNotImplemented(message) {
        if (this.throwOnUnimplemented) {
            throw new errors_1.NotSupportedYetError(message);
        }
        else {
            console.log(message);
        }
    }
}
exports.CairoASTNodeWriter = CairoASTNodeWriter;
//# sourceMappingURL=base.js.map