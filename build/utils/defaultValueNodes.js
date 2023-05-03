"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultValue = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const getTypeString_1 = require("./getTypeString");
const nodeTemplates_1 = require("./nodeTemplates");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
const utils_1 = require("./utils");
function getDefaultValue(nodeType, parentNode, ast) {
    if (shouldUsePlaceholderLiteral(nodeType, parentNode, ast))
        return intDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.AddressType)
        return addressDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.ArrayType)
        return arrayDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.BytesType)
        return bytesDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.BoolType)
        return boolDefault(parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.FixedBytesType)
        return fixedBytesDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.IntType)
        return intDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.PointerType)
        return pointerDefault(nodeType, parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.StringType)
        return stringDefault(parentNode, ast);
    else if (nodeType instanceof solc_typed_ast_1.UserDefinedType)
        return userDefDefault(nodeType, parentNode, ast);
    else
        throw new errors_1.NotSupportedYetError(`Default value not implemented for ${(0, astPrinter_1.printTypeNode)(nodeType)}`);
}
exports.getDefaultValue = getDefaultValue;
function shouldUsePlaceholderLiteral(nodeType, parentNode, ast) {
    if ((0, nodeTypeProcessing_1.isStorageSpecificType)(nodeType, ast))
        return true;
    if (parentNode instanceof solc_typed_ast_1.VariableDeclaration &&
        !parentNode.stateVariable &&
        parentNode.storageLocation === solc_typed_ast_1.DataLocation.Storage) {
        return true;
    }
    return false;
}
function intDefault(node, parentNode, ast) {
    return (0, nodeTemplates_1.createNumberLiteral)(0, ast, (0, getTypeString_1.generateExpressionTypeString)(node));
}
function fixedBytesDefault(node, parentNode, ast) {
    return (0, nodeTemplates_1.createNumberLiteral)('0x0', ast, node.pp());
}
function boolDefault(node, ast) {
    return (0, nodeTemplates_1.createBoolLiteral)(false, ast);
}
function addressDefault(nodeType, node, ast) {
    return new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, nodeType.pp(), solc_typed_ast_1.FunctionCallKind.TypeConversion, new solc_typed_ast_1.ElementaryTypeNameExpression(ast.reserveId(), '', `type(${nodeType.pp()})`, (0, nodeTemplates_1.createAddressTypeName)(nodeType.payable, ast)), [intDefault(nodeType, node, ast)], undefined, node.raw);
}
function arrayDefault(nodeType, parentNode, ast) {
    const tString = nodeType.elementT.pp();
    if (nodeType.size === undefined) {
        // Dynamically-sized arrays
        return new solc_typed_ast_1.FunctionCall(ast.reserveId(), parentNode.src, `${tString}[] memory`, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.NewExpression(ast.reserveId(), '', `function (uint256) pure returns (${tString}[] memory)`, (0, utils_1.typeNameFromTypeNode)(nodeType, ast)), [intDefault(new solc_typed_ast_1.IntType(256, false), parentNode, ast)], undefined, parentNode.raw);
    }
    else {
        // Statically typed array
        const expList = [];
        for (let i = 0; i < nodeType.size; i++) {
            expList.push(getDefaultValue(nodeType.elementT, parentNode, ast));
        }
        return new solc_typed_ast_1.TupleExpression(ast.reserveId(), parentNode.src, `${getTupleTypeString(nodeType)} memory`, true, // isInlineArray
        expList, parentNode.raw);
    }
}
function bytesDefault(nodeType, parentNode, ast) {
    return new solc_typed_ast_1.FunctionCall(ast.reserveId(), parentNode.src, `bytes memory`, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.NewExpression(ast.reserveId(), '', `function (uint256) pure returns (bytes memory)`, (0, utils_1.typeNameFromTypeNode)(nodeType, ast)), [intDefault(new solc_typed_ast_1.IntType(256, false), parentNode, ast)], undefined, parentNode.raw);
}
function stringDefault(node, ast) {
    return (0, nodeTemplates_1.createStringLiteral)('', ast);
}
function userDefDefault(nodeType, parentNode, ast) {
    if (nodeType.definition instanceof solc_typed_ast_1.StructDefinition)
        return structDefault(nodeType.definition, parentNode, ast);
    if (nodeType.definition instanceof solc_typed_ast_1.EnumDefinition)
        return enumDefault(nodeType, nodeType.definition, parentNode, ast);
    if (nodeType.definition instanceof solc_typed_ast_1.ContractDefinition)
        return new solc_typed_ast_1.FunctionCall(ast.reserveId(), '', nodeType.pp(), solc_typed_ast_1.FunctionCallKind.TypeConversion, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `type(${nodeType.pp()})`, nodeType.definition.name, nodeType.definition.id), [addressDefault(new solc_typed_ast_1.AddressType(false), parentNode, ast)]);
    if (nodeType.definition instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition)
        return getDefaultValue((0, nodeTypeProcessing_1.safeGetNodeType)(nodeType.definition.underlyingType, ast.inference), parentNode, ast);
    throw new errors_1.TranspileFailedError(`Couldn't get a default value for user defined: ${(0, astPrinter_1.printNode)(nodeType.definition)}`);
}
function enumDefault(node, definition, parentNode, ast) {
    const defaultValue = definition.vMembers[0]; //Enums require at least one member
    return new solc_typed_ast_1.MemberAccess(ast.reserveId(), parentNode.src, node.pp(), new solc_typed_ast_1.Identifier(ast.reserveId(), '', `type(${node.pp()})`, definition.name, definition.id), defaultValue.name, defaultValue.id, parentNode.raw);
}
function structDefault(structNode, node, ast) {
    const argsList = [];
    for (const member of structNode.vMembers) {
        const tNode = (0, nodeTypeProcessing_1.safeGetNodeType)(member, ast.inference);
        argsList.push(getDefaultValue(tNode, node, ast));
    }
    return new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, `struct ${structNode.canonicalName} memory`, solc_typed_ast_1.FunctionCallKind.StructConstructorCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `type(struct ${structNode.canonicalName} storage pointer)`, structNode.name, structNode.id), argsList, undefined, node.raw);
}
function pointerDefault(nodeType, parentNode, ast) {
    if (nodeType.to instanceof solc_typed_ast_1.ArrayType)
        return arrayDefault(nodeType.to, parentNode, ast);
    else if (nodeType.to instanceof solc_typed_ast_1.UserDefinedType)
        return userDefDefault(nodeType.to, parentNode, ast);
    else if (nodeType.to instanceof solc_typed_ast_1.StringType)
        return stringDefault(parentNode, ast);
    else {
        throw new errors_1.TranspileFailedError(`Couldn't get a default value for pointer: ${(0, astPrinter_1.printTypeNode)(nodeType)}`);
    }
}
function getTupleTypeString(nodeType) {
    const node = nodeType.elementT;
    if (node instanceof solc_typed_ast_1.PointerType) {
        if (node.to instanceof solc_typed_ast_1.ArrayType)
            return `${getTupleTypeString(node.to)} memory[${nodeType.size}]`;
        else
            throw new errors_1.TranspileFailedError(`Couldn't get tuple type string, is not ArrayType: ${(0, astPrinter_1.printTypeNode)(node.to)}`);
    }
    else {
        return nodeType.pp();
    }
}
//# sourceMappingURL=defaultValueNodes.js.map