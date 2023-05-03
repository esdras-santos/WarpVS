"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoBlockFunctionDefinition = void 0;
const cairoFunctionDefinition_1 = require("./cairoFunctionDefinition");
const cairoRawStringFunctionDefinition_1 = require("./cairoRawStringFunctionDefinition");
class CairoBlockFunctionDefinition extends cairoRawStringFunctionDefinition_1.CairoRawStringFunctionDefinition {
    constructor(id, src, scope, kind, name, visibility, stateMutability, parameters, returnParameters, rawStringDefinition) {
        super(id, src, scope, kind, name, visibility, stateMutability, parameters, returnParameters, cairoFunctionDefinition_1.FunctionStubKind.FunctionDefStub, rawStringDefinition);
    }
}
exports.CairoBlockFunctionDefinition = CairoBlockFunctionDefinition;
//# sourceMappingURL=cairoBlockFunctionDefinition.js.map