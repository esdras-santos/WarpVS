"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoRawStringFunctionDefinition = void 0;
const cairoFunctionDefinition_1 = require("./cairoFunctionDefinition");
const cairoParsing_1 = require("../../utils/cairoParsing");
class CairoRawStringFunctionDefinition extends cairoFunctionDefinition_1.CairoFunctionDefinition {
    constructor(id, src, scope, kind, name, visibility, stateMutability, parameters, returnParameters, functionSutbKind, rawStringDefinition, acceptsRawDArray = false, acceptsUnpackedStructArray = false) {
        super(id, src, scope, kind, name, false, // Virtual
        visibility, stateMutability, false, // IsConstructor
        parameters, returnParameters, [], // Modifier Invocation
        functionSutbKind === cairoFunctionDefinition_1.FunctionStubKind.FunctionDefStub
            ? new Set((0, cairoParsing_1.getRawCairoFunctionInfo)(rawStringDefinition).implicits)
            : new Set(), functionSutbKind, acceptsRawDArray, acceptsUnpackedStructArray);
        this.rawStringDefinition = rawStringDefinition;
    }
}
exports.CairoRawStringFunctionDefinition = CairoRawStringFunctionDefinition;
//# sourceMappingURL=cairoRawStringFunctionDefinition.js.map