"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoGeneratedFunctionDefinition = void 0;
const cairoRawStringFunctionDefinition_1 = require("./cairoRawStringFunctionDefinition");
class CairoGeneratedFunctionDefinition extends cairoRawStringFunctionDefinition_1.CairoRawStringFunctionDefinition {
    constructor(id, src, scope, kind, name, visibility, stateMutability, parameters, returnParameters, functionStubKind, rawStringDefinition, functionsCalled, acceptsRawDArray = false, acceptsUnpackedStructArray = false) {
        super(id, src, scope, kind, name, visibility, stateMutability, parameters, returnParameters, functionStubKind, rawStringDefinition, acceptsRawDArray, acceptsUnpackedStructArray);
        this.functionsCalled = removeRepeatedFunction(functionsCalled);
    }
}
exports.CairoGeneratedFunctionDefinition = CairoGeneratedFunctionDefinition;
function removeRepeatedFunction(functionsCalled) {
    return [...new Set(functionsCalled)];
}
//# sourceMappingURL=cairoGeneratedFunctionDefinition.js.map