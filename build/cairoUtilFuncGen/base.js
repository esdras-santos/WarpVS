"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateBasedOnType = exports.locationIfComplexType = exports.mul = exports.add = exports.StringIndexedFuncGenWithAuxiliar = exports.StringIndexedFuncGen = exports.CairoUtilFuncGenBase = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const functionGeneration_1 = require("../utils/functionGeneration");
const errors_1 = require("../utils/errors");
const importFuncGenerator_1 = require("../utils/importFuncGenerator");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
/*
  Base class for all specific cairo function generators
  These exist for cases where a transform we need is too specific to cairo to
  be doable by directly changing the solidity AST, so a stubbed FunctionDefintion
  is created and called in the AST, and a cairo definition for the function is either
  directly added to the output code, or one in warplib is referenced
*/
class CairoUtilFuncGenBase {
    constructor(ast, sourceUnit) {
        this.imports = new Map();
        this.ast = ast;
        this.sourceUnit = sourceUnit;
    }
    requireImport(location, name, inputs, outputs) {
        return (0, importFuncGenerator_1.createImport)(location, name, this.sourceUnit, this.ast, inputs, outputs);
    }
}
exports.CairoUtilFuncGenBase = CairoUtilFuncGenBase;
/*
  Most subclasses of CairoUtilFuncGenBase index their CairoFunctions off a single string,
  usually the cairo type of the input that the function's code depends on
*/
class StringIndexedFuncGen extends CairoUtilFuncGenBase {
    constructor() {
        super(...arguments);
        this.generatedFunctionsDef = new Map();
    }
}
exports.StringIndexedFuncGen = StringIndexedFuncGen;
class StringIndexedFuncGenWithAuxiliar extends StringIndexedFuncGen {
    constructor() {
        super(...arguments);
        this.auxiliarGeneratedFunctions = new Map();
    }
    createAuxiliarGeneratedFunction(genFuncInfo) {
        return (0, functionGeneration_1.createCairoGeneratedFunction)(genFuncInfo, [], [], this.ast, this.sourceUnit);
    }
}
exports.StringIndexedFuncGenWithAuxiliar = StringIndexedFuncGenWithAuxiliar;
// Quick shortcut for writing `${base} + ${offset}` that also shortens it in the case of +0
function add(base, offset) {
    return offset === 0 ? base : `${base} + ${offset}`;
}
exports.add = add;
// Quick shortcut for writing `${base} * ${scalar}` that also shortens it in the case of *1
function mul(base, scalar) {
    return scalar === 1 ? base : `${base} * ${scalar}`;
}
exports.mul = mul;
// This is needed because index access and member access functions return pointers, even if the data
// pointed to is a basic type, whereas read and write functions need to only return pointers if the
// data they're reading or writing is a complex type
function locationIfComplexType(type, location) {
    const base = (0, solc_typed_ast_1.generalizeType)(type)[0];
    if ((0, nodeTypeProcessing_1.isReferenceType)(base)) {
        return location;
    }
    else {
        return solc_typed_ast_1.DataLocation.Default;
    }
}
exports.locationIfComplexType = locationIfComplexType;
function delegateBasedOnType(type, dynamicArrayFunc, staticArrayFunc, structFunc, mappingFunc, valueFunc) {
    if (type instanceof solc_typed_ast_1.PointerType) {
        throw new errors_1.TranspileFailedError(`Attempted to delegate copy semantics based on specialised type ${type.pp()}`);
    }
    else if ((0, nodeTypeProcessing_1.isDynamicArray)(type)) {
        (0, assert_1.default)(type instanceof solc_typed_ast_1.ArrayType || type instanceof solc_typed_ast_1.BytesType || type instanceof solc_typed_ast_1.StringType);
        return dynamicArrayFunc(type);
    }
    else if (type instanceof solc_typed_ast_1.ArrayType) {
        return staticArrayFunc(type);
    }
    else if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        return structFunc(type, type.definition);
    }
    else if (type instanceof solc_typed_ast_1.MappingType) {
        return mappingFunc(type);
    }
    else {
        return valueFunc(type);
    }
}
exports.delegateBasedOnType = delegateBasedOnType;
//# sourceMappingURL=base.js.map