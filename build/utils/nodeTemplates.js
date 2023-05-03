"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVariableDeclarationStatement = exports.createDefaultConstructor = exports.createUintNTypeName = exports.createUint8TypeName = exports.createUint256TypeName = exports.createReturn = exports.createParameterList = exports.createStringLiteral = exports.createNumberTypeName = exports.createNumberLiteral = exports.createIdentifier = exports.createExpressionStatement = exports.createTuple = exports.createEmptyTuple = exports.createBytesNTypeName = exports.createBytesTypeName = exports.createBoolTypeName = exports.createBoolLiteral = exports.createUncheckedBlock = exports.createBlock = exports.createStaticArrayTypeName = exports.createArrayTypeName = exports.createStringTypeName = exports.createAddressTypeName = exports.createCairoTempVar = void 0;
const console_1 = require("console");
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const getTypeString_1 = require("./getTypeString");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
const typeConstructs_1 = require("./typeConstructs");
const utils_1 = require("./utils");
function createCairoTempVar(name, ast) {
    const node = new cairoNodes_1.CairoTempVarStatement(ast.reserveId(), '', name);
    ast.setContextRecursive(node);
    return node;
}
exports.createCairoTempVar = createCairoTempVar;
function createAddressTypeName(payable, ast) {
    const node = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', payable ? 'address payable' : 'address', 'address', payable ? 'payable' : 'nonpayable');
    ast.setContextRecursive(node);
    return node;
}
exports.createAddressTypeName = createAddressTypeName;
function createStringTypeName(ast) {
    const node = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'string', 'string', 'nonpayable');
    ast.setContextRecursive(node);
    return node;
}
exports.createStringTypeName = createStringTypeName;
function createArrayTypeName(baseType, ast) {
    const node = new solc_typed_ast_1.ArrayTypeName(ast.reserveId(), '', `${baseType.typeString}[]`, baseType);
    ast.setContextRecursive(node);
    return node;
}
exports.createArrayTypeName = createArrayTypeName;
function createStaticArrayTypeName(baseType, size, ast) {
    const node = new solc_typed_ast_1.ArrayTypeName(ast.reserveId(), '', `${baseType.typeString}[${size}]`, baseType, createNumberLiteral(size, ast));
    ast.setContextRecursive(node);
    return node;
}
exports.createStaticArrayTypeName = createStaticArrayTypeName;
function createBlock(statements, ast, documentation) {
    const block = new solc_typed_ast_1.Block(ast.reserveId(), '', statements, documentation);
    ast.setContextRecursive(block);
    return block;
}
exports.createBlock = createBlock;
function createUncheckedBlock(statements, ast, documentation) {
    const block = new solc_typed_ast_1.UncheckedBlock(ast.reserveId(), '', statements, documentation);
    ast.setContextRecursive(block);
    return block;
}
exports.createUncheckedBlock = createUncheckedBlock;
function createBoolLiteral(value, ast) {
    const valueString = value ? 'true' : 'false';
    const node = new solc_typed_ast_1.Literal(ast.reserveId(), '', 'bool', solc_typed_ast_1.LiteralKind.Bool, (0, utils_1.toHexString)(valueString), valueString);
    ast.setContextRecursive(node);
    return node;
}
exports.createBoolLiteral = createBoolLiteral;
function createBoolTypeName(ast) {
    const node = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'bool', 'bool');
    ast.setContextRecursive(node);
    return node;
}
exports.createBoolTypeName = createBoolTypeName;
function createBytesTypeName(ast) {
    const node = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'bytes', 'bytes');
    ast.setContextRecursive(node);
    return node;
}
exports.createBytesTypeName = createBytesTypeName;
function createBytesNTypeName(n, ast) {
    const node = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', `bytes${n}`, `bytes${n}`);
    ast.setContextRecursive(node);
    return node;
}
exports.createBytesNTypeName = createBytesNTypeName;
function createEmptyTuple(ast) {
    return createTuple(ast, []);
}
exports.createEmptyTuple = createEmptyTuple;
function createTuple(ast, nodes) {
    const typeString = `tuple(${nodes.map((node) => node.typeString)})`;
    const node = new solc_typed_ast_1.TupleExpression(ast.reserveId(), '', typeString, false, nodes);
    ast.setContextRecursive(node);
    return node;
}
exports.createTuple = createTuple;
function createExpressionStatement(ast, expression) {
    const node = new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), '', expression);
    ast.setContextRecursive(node);
    return node;
}
exports.createExpressionStatement = createExpressionStatement;
function createIdentifier(variable, ast, dataLocation, lookupNode) {
    const type = (0, nodeTypeProcessing_1.specializeType)((0, nodeTypeProcessing_1.safeGetNodeTypeInCtx)(variable, ast.inference, lookupNode ?? variable), dataLocation ?? (variable.stateVariable ? solc_typed_ast_1.DataLocation.Storage : variable.storageLocation));
    const node = new solc_typed_ast_1.Identifier(ast.reserveId(), '', (0, getTypeString_1.generateExpressionTypeString)(type), variable.name, variable.id);
    ast.setContextRecursive(node);
    return node;
}
exports.createIdentifier = createIdentifier;
function createNumberLiteral(value, ast, typeString) {
    const stringValue = typeof value === 'string' ? value : BigInt(value).toString();
    typeString = typeString ?? (0, getTypeString_1.generateLiteralTypeString)(stringValue);
    const node = new solc_typed_ast_1.Literal(ast.reserveId(), '', typeString, solc_typed_ast_1.LiteralKind.Number, (0, utils_1.toHexString)(stringValue), stringValue);
    ast.setContextRecursive(node);
    return node;
}
exports.createNumberLiteral = createNumberLiteral;
function createNumberTypeName(width, signed, ast) {
    const typestring = `${signed ? '' : 'u'}int${width}`;
    const typeName = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', typestring, typestring);
    ast.setContextRecursive(typeName);
    return typeName;
}
exports.createNumberTypeName = createNumberTypeName;
function createStringLiteral(value, ast) {
    const node = new solc_typed_ast_1.Literal(ast.reserveId(), '', `literal_string "${value}"`, solc_typed_ast_1.LiteralKind.String, (0, utils_1.toHexString)(value), value);
    ast.setContextRecursive(node);
    return node;
}
exports.createStringLiteral = createStringLiteral;
function createParameterList(params, ast, scope) {
    const paramList = new solc_typed_ast_1.ParameterList(ast.reserveId(), '', params);
    ast.setContextRecursive(paramList);
    if (scope !== undefined) {
        [...params].forEach((decl) => (decl.scope = scope));
    }
    [...params].forEach((decl) => {
        if (decl.stateVariable) {
            decl.stateVariable = false;
            decl.storageLocation = solc_typed_ast_1.DataLocation.Storage;
        }
    });
    return paramList;
}
exports.createParameterList = createParameterList;
function createReturn(toReturn, retParamListId, ast, lookupNode) {
    const retValue = toReturn === undefined || toReturn instanceof solc_typed_ast_1.Expression
        ? toReturn
        : (0, utils_1.toSingleExpression)(toReturn.map((decl) => createIdentifier(decl, ast, undefined, lookupNode)), ast);
    const node = new solc_typed_ast_1.Return(ast.reserveId(), '', retParamListId, retValue);
    ast.setContextRecursive(node);
    return node;
}
exports.createReturn = createReturn;
function createUint256TypeName(ast) {
    const typeName = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'uint256', 'uint256');
    ast.setContextRecursive(typeName);
    return typeName;
}
exports.createUint256TypeName = createUint256TypeName;
function createUint8TypeName(ast) {
    const typeName = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'uint8', 'uint8');
    ast.setContextRecursive(typeName);
    return typeName;
}
exports.createUint8TypeName = createUint8TypeName;
function createUintNTypeName(n, ast) {
    const typeName = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', `uint${n}`, `uint${n}`);
    ast.setContextRecursive(typeName);
    return typeName;
}
exports.createUintNTypeName = createUintNTypeName;
function createDefaultConstructor(node, ast) {
    const newFunc = new solc_typed_ast_1.FunctionDefinition(ast.reserveId(), '', node.id, solc_typed_ast_1.FunctionKind.Constructor, '', false, // virtual
    solc_typed_ast_1.FunctionVisibility.Public, solc_typed_ast_1.FunctionStateMutability.NonPayable, true, // isConstructor
    createParameterList([], ast), createParameterList([], ast), []);
    ast.setContextRecursive(newFunc);
    return newFunc;
}
exports.createDefaultConstructor = createDefaultConstructor;
function createVariableDeclarationStatement(varDecls, initialValue, ast) {
    (0, console_1.assert)(varDecls.some(typeConstructs_1.notNull), `Attempted to create variable declaration statement with no variables`);
    const node = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', varDecls.map((v) => (v === null ? null : v.id)), varDecls.filter(typeConstructs_1.notNull), initialValue);
    ast.setContextRecursive(node);
    return node;
}
exports.createVariableDeclarationStatement = createVariableDeclarationStatement;
//# sourceMappingURL=nodeTemplates.js.map