"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoAssert = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
/*
 Represents solidity asserts, requires, and reverts
 Does nothing if its child expression is true, aborts execution if not
 Transpiled as `assert vExpression = 1`
*/
class CairoAssert extends solc_typed_ast_1.Expression {
    constructor(id, src, expression, assertMessage = null, raw) {
        super(id, src, 'tuple()', raw);
        this.vExpression = expression;
        this.assertMessage = assertMessage;
        this.acceptChildren();
    }
    get children() {
        return this.pickNodes(this.vExpression);
    }
}
exports.CairoAssert = CairoAssert;
//# sourceMappingURL=cairoAssert.js.map