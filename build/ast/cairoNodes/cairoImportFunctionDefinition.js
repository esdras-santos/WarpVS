"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoImportFunctionDefinition = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoFunctionDefinition_1 = require("./cairoFunctionDefinition");
class CairoImportFunctionDefinition extends cairoFunctionDefinition_1.CairoFunctionDefinition {
    constructor(id, src, scope, name, path, implicits, parameters, returnParameters, stubKind, acceptsRawDArray = false, acceptsUnpackedStructArray = false) {
        super(id, src, scope, solc_typed_ast_1.FunctionKind.Function, name, false, solc_typed_ast_1.FunctionVisibility.Internal, solc_typed_ast_1.FunctionStateMutability.NonPayable, false, parameters, returnParameters, [], implicits, stubKind, acceptsRawDArray, acceptsUnpackedStructArray);
        this.path = path;
    }
}
exports.CairoImportFunctionDefinition = CairoImportFunctionDefinition;
//# sourceMappingURL=cairoImportFunctionDefinition.js.map