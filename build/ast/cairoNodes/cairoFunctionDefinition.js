"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoFunctionDefinition = exports.FunctionStubKind = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
/*
 An extension of FunctionDefinition to track which implicit arguments are used (This is no
 longer supported in Cairo1, compiler itself will infer what is needed. We still need to
 use warp-memory so the structure is kept for now to trace if it's used 'warp-memory'
 in the function).
 Additionally we often use function stubs for instances where we want to be able
 to insert function during transpilation where it wouldn't make sense to include
 their body in the AST. For example, stubs are used for warplib functions, and
 those generated to handle memory and storage processing. Marking a CairoFunctionDefinition
 as a stub tells the CairoWriter not to print it.
*/
var FunctionStubKind;
(function (FunctionStubKind) {
    FunctionStubKind[FunctionStubKind["None"] = 0] = "None";
    FunctionStubKind[FunctionStubKind["FunctionDefStub"] = 1] = "FunctionDefStub";
    FunctionStubKind[FunctionStubKind["StorageDefStub"] = 2] = "StorageDefStub";
    FunctionStubKind[FunctionStubKind["StructDefStub"] = 3] = "StructDefStub";
})(FunctionStubKind = exports.FunctionStubKind || (exports.FunctionStubKind = {}));
class CairoFunctionDefinition extends solc_typed_ast_1.FunctionDefinition {
    constructor(id, src, scope, kind, name, virtual, visibility, stateMutability, isConstructor, parameters, returnParameters, modifiers, implicits, functionStubKind = FunctionStubKind.None, acceptsRawDArray = false, acceptsUnpackedStructArray = false, overrideSpecifier, body, documentation, nameLocation, raw) {
        (0, assert_1.default)(!(acceptsRawDArray && acceptsUnpackedStructArray), 'A function cannot receive both structured and raw dynamic arrays');
        super(id, src, scope, kind, name, virtual, visibility, stateMutability, isConstructor, parameters, returnParameters, modifiers, overrideSpecifier, body, documentation, nameLocation, raw);
        this.implicits = implicits;
        this.functionStubKind = functionStubKind;
        this.acceptsRawDarray = acceptsRawDArray;
        this.acceptsUnpackedStructArray = acceptsUnpackedStructArray;
    }
}
exports.CairoFunctionDefinition = CairoFunctionDefinition;
//# sourceMappingURL=cairoFunctionDefinition.js.map