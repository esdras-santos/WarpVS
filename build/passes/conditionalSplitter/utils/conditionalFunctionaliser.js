"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatementsForVoidConditionals = exports.getNodeVariables = exports.addStatementsToCallFunction = exports.createReturnBody = exports.createFunctionBody = exports.getParams = exports.getInputs = exports.getConditionalReturn = exports.getReturns = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const cloning_1 = require("../../../utils/cloning");
const defaultValueNodes_1 = require("../../../utils/defaultValueNodes");
const functionGeneration_1 = require("../../../utils/functionGeneration");
const nameModifiers_1 = require("../../../utils/nameModifiers");
const nodeTemplates_1 = require("../../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const utils_1 = require("../../../utils/utils");
// The returns should be both the values returned by the conditional itself,
// as well as the variables that got captured, as they could have been modified
function getReturns(variables, conditionalReturn, ast) {
    const capturedVars = [...variables].map(([decl]) => (0, cloning_1.cloneASTNode)(decl, ast));
    return (0, nodeTemplates_1.createParameterList)([...conditionalReturn, ...capturedVars], ast);
}
exports.getReturns = getReturns;
function getConditionalReturn(node, funcId, nameCounter, ast) {
    const conditionalType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    const variables = conditionalType instanceof solc_typed_ast_1.TupleType
        ? getAllVariables(conditionalType, funcId, nameCounter, ast)
        : [getVar((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference), node.typeString, funcId, nameCounter, ast)];
    return variables;
}
exports.getConditionalReturn = getConditionalReturn;
function getVar(typeNode, typeString, scope, nameCounter, ast) {
    return new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
    false, // indexed
    `${nameModifiers_1.CONDITIONAL_RETURN_VARIABLE}${nameCounter.next().value}`, scope, false, // stateVariable
    getLocationFromTypeNode(typeNode), solc_typed_ast_1.StateVariableVisibility.Private, solc_typed_ast_1.Mutability.Mutable, typeString, undefined, (0, utils_1.typeNameFromTypeNode)(typeNode, ast));
}
function getAllVariables(conditionalType, scope, nameCounter, ast) {
    if (conditionalType.elements.length === 0)
        return [];
    else
        return conditionalType.elements.map((t) => getVar(t, t.pp(), scope, nameCounter, ast));
}
// The inputs to the function should be only the free variables
// The branches get inlined into the function so that only the taken
// branch gets executed
function getInputs(variables, ast) {
    return [...variables].map(([decl]) => (0, nodeTemplates_1.createIdentifier)(decl, ast));
}
exports.getInputs = getInputs;
// The parameters should be the same as the inputs
// However this must also create new variable declarations to
// use in the new function, and rebind internal identifiers
// to these new variables
function getParams(variables, ast) {
    return (0, nodeTemplates_1.createParameterList)([...variables].map(([decl, ids]) => {
        const newVar = (0, cloning_1.cloneASTNode)(decl, ast);
        ids.forEach((id) => (id.referencedDeclaration = newVar.id));
        return newVar;
    }), ast);
}
exports.getParams = getParams;
function createFunctionBody(node, conditionalReturn, returns, ast) {
    return (0, nodeTemplates_1.createBlock)([
        new solc_typed_ast_1.IfStatement(ast.reserveId(), '', node.vCondition, createReturnBody(returns, node.vTrueExpression, conditionalReturn, ast, node), createReturnBody(returns, node.vFalseExpression, conditionalReturn, ast, node)),
    ], ast);
}
exports.createFunctionBody = createFunctionBody;
function createReturnBody(returns, value, conditionalReturn, ast, lookupNode) {
    const conditionalReturnIdentifiers = conditionalReturn.map((variable) => (0, nodeTemplates_1.createIdentifier)(variable, ast, undefined, lookupNode));
    const expr = conditionalReturn.length === 0
        ? value
        : new solc_typed_ast_1.Assignment(ast.reserveId(), '', value.typeString, '=', (0, utils_1.toSingleExpression)(conditionalReturnIdentifiers, ast), value);
    return (0, nodeTemplates_1.createBlock)([
        new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), '', expr),
        (0, nodeTemplates_1.createReturn)(returns.vParameters, returns.id, ast, lookupNode),
    ], ast);
}
exports.createReturnBody = createReturnBody;
function addStatementsToCallFunction(node, conditionalResult, variables, funcToCall, ast) {
    const statements = [
        (0, nodeTemplates_1.createVariableDeclarationStatement)(conditionalResult, (0, utils_1.toSingleExpression)(conditionalResult.map((v) => (0, defaultValueNodes_1.getDefaultValue)((0, nodeTypeProcessing_1.safeGetNodeTypeInCtx)(v, ast.inference, node), node, ast)), ast), ast),
        (0, functionGeneration_1.createOuterCall)(node, [...conditionalResult, ...variables], funcToCall, ast),
    ];
    return statements;
}
exports.addStatementsToCallFunction = addStatementsToCallFunction;
function getNodeVariables(node) {
    return new Map([...(0, functionGeneration_1.collectUnboundVariables)(node)].filter(([decl]) => !decl.stateVariable));
}
exports.getNodeVariables = getNodeVariables;
// There might be two different cases where conditionals return void:
// - they are the expression of a return statement
// - they are the expression of an expressionStatement
// There might be nested conditionals as well, but the pass goes through
// the outermost first and transform it, so it falls in the previous cases
function getStatementsForVoidConditionals(node, variables, funcToCall, ast) {
    const parent = node.getClosestParentByType(solc_typed_ast_1.Return) ?? node.getClosestParentByType(solc_typed_ast_1.ExpressionStatement);
    (0, assert_1.default)(parent !== undefined, `Expected parent for ${(0, astPrinter_1.printNode)(node)} was not found`);
    const outerCall = (0, functionGeneration_1.createOuterCall)(node, variables, funcToCall, ast);
    // In both cases it must be checked that the conditional is a direct child of the `parent`
    // node, otherwise it means that this conditional, that doesn't return a value, is inside
    // another expression, which breaks the two cases mentioned previously.
    if (parent instanceof solc_typed_ast_1.Return) {
        (0, assert_1.default)(parent.vExpression === node, `Expected conditional to be the returned expression`);
        ast.insertStatementBefore(parent, outerCall);
        parent.vExpression = undefined;
    }
    else {
        (0, assert_1.default)(parent.vExpression === node, `Expected conditional to be the expression of the ExpressionStatement`);
        ast.replaceNode(parent, outerCall);
    }
}
exports.getStatementsForVoidConditionals = getStatementsForVoidConditionals;
function getLocationFromTypeNode(typeNode) {
    if (typeNode instanceof solc_typed_ast_1.PointerType)
        return typeNode.location;
    else
        return solc_typed_ast_1.DataLocation.Default;
}
//# sourceMappingURL=conditionalFunctionaliser.js.map