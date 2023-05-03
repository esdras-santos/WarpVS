"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDynamicallySized = exports.getByteSize = exports.getPackedByteSize = exports.safeCanonicalHash = exports.safeGetNodeTypeInCtx = exports.safeGetNodeType = exports.isStorageSpecificType = exports.getSize = exports.getElementType = exports.checkableType = exports.hasMapping = exports.isAddressType = exports.isMapping = exports.isComplexMemoryType = exports.isDynamicStorageArray = exports.isValueType = exports.isReferenceType = exports.isStruct = exports.isDynamicCallDataArray = exports.isDynamicArray = exports.intTypeForLiteral = exports.specializeType = exports.typeNameToSpecializedTypeNode = exports.getParameterTypes = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const abi_1 = require("solc-typed-ast/dist/types/abi");
const keccak_1 = __importDefault(require("keccak"));
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const formatting_1 = require("./formatting");
const utils_1 = require("./utils");
const typeStringParser_1 = require("./typeStrings/typeStringParser");
/*
Normal function calls and struct constructors require different methods for
getting the expected types of their arguments, this centralises that process
Does not handle type conversion functions, as they don't have a specific input type
*/
function getParameterTypes(functionCall, ast) {
    const functionType = safeGetNodeType(functionCall.vExpression, ast.inference);
    switch (functionCall.kind) {
        case solc_typed_ast_1.FunctionCallKind.FunctionCall:
            (0, assert_1.default)(functionType instanceof solc_typed_ast_1.FunctionLikeType, `Expected ${(0, astPrinter_1.printNode)(functionCall.vExpression)} to be FunctionLikeType, got ${(0, astPrinter_1.printTypeNode)(functionType)}`);
            return functionType.parameters;
        case solc_typed_ast_1.FunctionCallKind.StructConstructorCall: {
            (0, assert_1.default)(functionType instanceof solc_typed_ast_1.TypeNameType &&
                functionType.type instanceof solc_typed_ast_1.PointerType &&
                functionType.type.to instanceof solc_typed_ast_1.UserDefinedType, (0, formatting_1.error)(`TypeNode for ${(0, astPrinter_1.printNode)(functionCall.vExpression)} was expected to be a TypeNameType(PointerType(UserDefinedType, _)), got ${(0, astPrinter_1.printTypeNode)(functionType, true)}`));
            const structDef = functionType.type.to.definition;
            (0, assert_1.default)(structDef instanceof solc_typed_ast_1.StructDefinition);
            return structDef.vMembers.map(ast.inference.variableDeclarationToTypeNode, ast.inference);
        }
        case solc_typed_ast_1.FunctionCallKind.TypeConversion:
            throw new errors_1.TranspileFailedError(`Cannot determine specific expected input type to type conversion function ${(0, astPrinter_1.printNode)(functionCall)}`);
    }
}
exports.getParameterTypes = getParameterTypes;
function typeNameToSpecializedTypeNode(typeName, loc, inference) {
    return specializeType(inference.typeNameToTypeNode(typeName), loc);
}
exports.typeNameToSpecializedTypeNode = typeNameToSpecializedTypeNode;
function specializeType(typeNode, loc) {
    if (typeNode instanceof solc_typed_ast_1.PointerType) {
        (0, assert_1.default)(typeNode.location === loc, `Attempting to specialize ${typeNode.location} pointer type to ${loc}\nType:${(0, astPrinter_1.printTypeNode)(typeNode, true)}`);
        return typeNode;
    }
    (0, assert_1.default)(!(typeNode instanceof solc_typed_ast_1.TupleType), 'Unexpected tuple type ${printTypeNode(typeNode)} in concretization.');
    if (typeNode instanceof solc_typed_ast_1.PackedArrayType) {
        return new solc_typed_ast_1.PointerType(typeNode, loc);
    }
    if (typeNode instanceof solc_typed_ast_1.ArrayType) {
        const concreteElT = specializeType(typeNode.elementT, loc);
        return new solc_typed_ast_1.PointerType(new solc_typed_ast_1.ArrayType(concreteElT, typeNode.size), loc);
    }
    if (typeNode instanceof solc_typed_ast_1.UserDefinedType) {
        const def = typeNode.definition;
        (0, assert_1.default)(def !== undefined, `Can't concretize user defined type ${(0, astPrinter_1.printTypeNode)(typeNode)} with no corresponding definition.`);
        if (def instanceof solc_typed_ast_1.StructDefinition) {
            return new solc_typed_ast_1.PointerType(typeNode, loc);
        }
        // Enums and contracts are value types
        return typeNode;
    }
    if (typeNode instanceof solc_typed_ast_1.MappingType) {
        // Always treat map keys as in-memory copies
        const concreteKeyT = specializeType(typeNode.keyType, solc_typed_ast_1.DataLocation.Memory);
        // The result of map indexing is always a pointer to a value that lives in storage
        const concreteValueT = specializeType(typeNode.valueType, solc_typed_ast_1.DataLocation.Storage);
        // Maps always live in storage
        return new solc_typed_ast_1.PointerType(new solc_typed_ast_1.MappingType(concreteKeyT, concreteValueT), solc_typed_ast_1.DataLocation.Storage);
    }
    // Note string literals are a special case where the location cannot be known by a function like this
    // We insert conversions around string literals based on how they are being used in implicitConversionToExplicit
    return typeNode;
}
exports.specializeType = specializeType;
function intTypeForLiteral(typestring) {
    (0, assert_1.default)(typestring.startsWith('int_const '), `Expected int literal typestring to start with "int_const ". Got ${typestring}`);
    const value = BigInt(typestring.slice('int_const '.length));
    if (value >= 0) {
        const binaryLength = value.toString(2).length;
        const width = 8 * Math.ceil(binaryLength / 8);
        return new solc_typed_ast_1.IntType(width, false);
    }
    else {
        // This is not the exact binary length in all cases, but it puts the values into the correct 8bit range
        const binaryLength = (-value - 1n).toString(2).length + 1;
        const width = 8 * Math.ceil(binaryLength / 8);
        return new solc_typed_ast_1.IntType(width, true);
    }
}
exports.intTypeForLiteral = intTypeForLiteral;
function isDynamicArray(type) {
    return ((type instanceof solc_typed_ast_1.PointerType && isDynamicArray(type.to)) ||
        (type instanceof solc_typed_ast_1.ArrayType && type.size === undefined) ||
        type instanceof solc_typed_ast_1.BytesType ||
        type instanceof solc_typed_ast_1.StringType);
}
exports.isDynamicArray = isDynamicArray;
function isDynamicCallDataArray(type) {
    return (type instanceof solc_typed_ast_1.PointerType &&
        type.location === solc_typed_ast_1.DataLocation.CallData &&
        isDynamicArray(type.to));
}
exports.isDynamicCallDataArray = isDynamicCallDataArray;
function isStruct(type) {
    return ((type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) ||
        (type instanceof solc_typed_ast_1.PointerType && isStruct(type.to)));
}
exports.isStruct = isStruct;
function isReferenceType(type) {
    return (type instanceof solc_typed_ast_1.ArrayType ||
        type instanceof solc_typed_ast_1.BytesType ||
        type instanceof solc_typed_ast_1.MappingType ||
        type instanceof solc_typed_ast_1.StringType ||
        (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) ||
        (type instanceof solc_typed_ast_1.PointerType && isReferenceType(type.to)));
}
exports.isReferenceType = isReferenceType;
function isValueType(type) {
    return !isReferenceType(type);
}
exports.isValueType = isValueType;
function isDynamicStorageArray(type) {
    return (type instanceof solc_typed_ast_1.PointerType && type.location === solc_typed_ast_1.DataLocation.Storage && isDynamicArray(type.to));
}
exports.isDynamicStorageArray = isDynamicStorageArray;
function isComplexMemoryType(type) {
    return (type instanceof solc_typed_ast_1.PointerType && type.location === solc_typed_ast_1.DataLocation.Memory && isReferenceType(type.to));
}
exports.isComplexMemoryType = isComplexMemoryType;
function isMapping(type) {
    const [base] = (0, solc_typed_ast_1.generalizeType)(type);
    return base instanceof solc_typed_ast_1.MappingType;
}
exports.isMapping = isMapping;
function isAddressType(type) {
    return (type instanceof solc_typed_ast_1.AddressType ||
        (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.ContractDefinition));
}
exports.isAddressType = isAddressType;
function hasMapping(type) {
    const [base] = (0, solc_typed_ast_1.generalizeType)(type);
    if (base instanceof solc_typed_ast_1.ArrayType) {
        return base.elementT instanceof solc_typed_ast_1.MappingType;
    }
    return base instanceof solc_typed_ast_1.MappingType;
}
exports.hasMapping = hasMapping;
function checkableType(type) {
    return (type instanceof solc_typed_ast_1.ArrayType ||
        type instanceof solc_typed_ast_1.BytesType ||
        type instanceof solc_typed_ast_1.FixedBytesType ||
        type instanceof solc_typed_ast_1.UserDefinedType ||
        type instanceof solc_typed_ast_1.AddressType ||
        (type instanceof solc_typed_ast_1.IntType && type.nBits < 256) ||
        type instanceof solc_typed_ast_1.StringType);
}
exports.checkableType = checkableType;
function getElementType(type) {
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return type.elementT;
    }
    else {
        return new solc_typed_ast_1.FixedBytesType(1);
    }
}
exports.getElementType = getElementType;
function getSize(type) {
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return type.size;
    }
    else {
        return undefined;
    }
}
exports.getSize = getSize;
function isStorageSpecificType(type, ast, visitedStructs = []) {
    if (type instanceof solc_typed_ast_1.MappingType)
        return true;
    if (type instanceof solc_typed_ast_1.PointerType)
        return isStorageSpecificType(type.to, ast, visitedStructs);
    if (type instanceof solc_typed_ast_1.ArrayType)
        return isStorageSpecificType(type.elementT, ast, visitedStructs);
    if (type instanceof solc_typed_ast_1.UserDefinedType &&
        type.definition instanceof solc_typed_ast_1.StructDefinition &&
        !visitedStructs.includes(type.definition.id)) {
        visitedStructs.push(type.definition.id);
        return type.definition.vMembers.some((m) => isStorageSpecificType(safeGetNodeType(m, ast.inference), ast, visitedStructs));
    }
    return false;
}
exports.isStorageSpecificType = isStorageSpecificType;
function safeGetNodeType(node, inference) {
    (0, utils_1.getContainingSourceUnit)(node);
    // if (node instanceof Literal) {
    //   return getNodeType(node, inference);
    // }
    // if (node instanceof CairoAssert){
    //   return new TupleType([]);
    // }
    // if (node instanceof VariableDeclaration) {
    //   return inference.variableDeclarationToTypeNode(node);
    // }
    // if (node instanceof TypeName) {
    //   return inference.typeNameToTypeNode(node)
    // }
    // return inference.typeOf(node);
    return (0, typeStringParser_1.getNodeType)(node, inference);
}
exports.safeGetNodeType = safeGetNodeType;
function safeGetNodeTypeInCtx(arg, inference, ctx) {
    (0, utils_1.getContainingSourceUnit)(ctx);
    return (0, typeStringParser_1.getNodeTypeInCtx)(arg, inference, ctx);
}
exports.safeGetNodeTypeInCtx = safeGetNodeTypeInCtx;
function safeCanonicalHash(f, ast) {
    const hasMappingArg = f.vParameters.vParameters.some((p) => hasMapping(safeGetNodeType(p, ast.inference)));
    if (hasMappingArg) {
        const typeString = `${f.name}(${f.vParameters.vParameters.map((p) => p.typeString).join(',')})`;
        const hash = (0, keccak_1.default)('keccak256')
            .update(typeString)
            .digest('hex')
            .slice(2)
            .slice(0, 4);
        return hash;
    }
    else {
        return ast.inference.signatureHash(f, abi_1.ABIEncoderVersion.V2);
    }
}
exports.safeCanonicalHash = safeCanonicalHash;
/**
 * Given a type returns its packed solidity bytes size
 * e.g. uint8 -> byte size is 1
 *      uint16[3] -> byte size is 6
 *      and so on
 *  address are 32 bytes instead of 20 bytes due to size difference
 *  between addresses in Starknet and Ethereum
 *  For every type whose byte size can be known on compile time
 *  @param type Solidity type
 *  @param version required for calculating structs byte size
 *  @returns returns the types byte representation using packed abi encoding
 */
function getPackedByteSize(type, inference) {
    if (type instanceof solc_typed_ast_1.IntType) {
        return type.nBits / 8;
    }
    if (type instanceof solc_typed_ast_1.FixedBytesType) {
        return type.size;
    }
    if (isAddressType(type)) {
        return 32;
    }
    if (type instanceof solc_typed_ast_1.BoolType ||
        (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.EnumDefinition)) {
        return 1;
    }
    if (type instanceof solc_typed_ast_1.ArrayType && type.size !== undefined) {
        return type.size * BigInt(getPackedByteSize(type.elementT, inference));
    }
    const sumMemberSize = (acc, cv) => {
        return acc + BigInt(getPackedByteSize(cv, inference));
    };
    if (type instanceof solc_typed_ast_1.TupleType) {
        return type.elements.reduce(sumMemberSize, 0n);
    }
    if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        return type.definition.vMembers
            .map((varDecl) => (0, typeStringParser_1.getNodeType)(varDecl, inference))
            .reduce(sumMemberSize, 0n);
    }
    throw new errors_1.TranspileFailedError(`Cannot calculate packed byte size for ${(0, astPrinter_1.printTypeNode)(type)}`);
}
exports.getPackedByteSize = getPackedByteSize;
/**
 * Given a type returns  solidity bytes size
 * e.g. uint8, bool, address -> byte size is 32
 *      T[] -> byte size is 32
 *      uint16[3] -> byte size is 96
 *      uint16[][3] -> byte size is 32
 *      and so on
 *  @param type Solidity type
 *  @param version parameter required for calculating struct byte size
 *  @returns returns the types byte representation using abi encoding
 */
function getByteSize(type, inference) {
    if (isValueType(type) || isDynamicallySized(type, inference)) {
        return 32;
    }
    if (type instanceof solc_typed_ast_1.ArrayType) {
        (0, assert_1.default)(type.size !== undefined);
        return type.size * BigInt(getByteSize(type.elementT, inference));
    }
    const sumMemberSize = (acc, cv) => {
        return acc + BigInt(getByteSize(cv, inference));
    };
    if (type instanceof solc_typed_ast_1.TupleType) {
        return type.elements.reduce(sumMemberSize, 0n);
    }
    if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        (0, assert_1.default)(inference.version !== undefined, 'Struct byte size calculation requires compiler version');
        return type.definition.vMembers
            .map((varDecl) => safeGetNodeType(varDecl, inference))
            .reduce(sumMemberSize, 0n);
    }
    throw new errors_1.TranspileFailedError(`Cannot calculate byte size for ${(0, astPrinter_1.printTypeNode)(type)}`);
}
exports.getByteSize = getByteSize;
function isDynamicallySized(type, inference) {
    if (isDynamicArray(type)) {
        return true;
    }
    if (type instanceof solc_typed_ast_1.PointerType) {
        return isDynamicallySized(type.to, inference);
    }
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return isDynamicallySized(type.elementT, inference);
    }
    if (type instanceof solc_typed_ast_1.TupleType) {
        return type.elements.some((t) => isDynamicallySized(t, inference));
    }
    if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        (0, assert_1.default)(inference.version !== undefined);
        return type.definition.vMembers.some((v) => isDynamicallySized(safeGetNodeType(v, inference), inference));
    }
    return false;
}
exports.isDynamicallySized = isDynamicallySized;
//# sourceMappingURL=nodeTypeProcessing.js.map