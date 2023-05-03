"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionModifierHandler = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nameModifiers_1 = require("../../utils/nameModifiers");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const functionModifierInliner_1 = require("./functionModifierInliner");
/*  This pass handles functions with modifiers.
    
    Modifier invocations are processed in the same order of appearance.
    The i-th modifier invocation is transformed into a function which contains the code
    of the corresponding modifier. Wherever there is a placeholder, this is replaced
    with a call to the function that results of transforming the function with modifiers
    from (i + 1) to n.
    When there are no more modifier invocations left, it simply calls the function which
    contains the original function code.
*/
class FunctionModifierHandler extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.count = 0;
    }
    visitFunctionDefinition(node, ast) {
        if (node.vModifiers.length === 0)
            return this.commonVisit(node, ast);
        const functionToCall = node.vModifiers.reduceRight((acc, modInvocation) => {
            const modifier = modInvocation.vModifier;
            (0, assert_1.default)(modifier instanceof solc_typed_ast_1.ModifierDefinition, `Unexpected call to contract ${modifier.id} constructor`);
            return this.getFunctionFromModifier(node, modifier, acc, ast);
        }, this.extractOriginalFunction(node, ast));
        const functionArgs = node.vParameters.vParameters.map((v) => (0, nodeTemplates_1.createIdentifier)(v, ast));
        const retCaptureArgs = node.vReturnParameters.vParameters.map((v) => (0, nodeTemplates_1.createIdentifier)(v, ast));
        const modArgs = node.vModifiers
            .map((modInvocation) => modInvocation.vArguments)
            .flat()
            .map((arg) => (0, cloning_1.cloneASTNode)(arg, ast));
        const argsList = [...modArgs, ...functionArgs, ...retCaptureArgs];
        const returnStatement = (0, nodeTemplates_1.createReturn)((0, functionGeneration_1.createCallToFunction)(functionToCall, argsList, ast), node.vReturnParameters.id, ast);
        const functionBody = (0, nodeTemplates_1.createBlock)([returnStatement], ast);
        node.vModifiers = [];
        node.vBody = functionBody;
        ast.registerChild(functionBody, node);
    }
    extractOriginalFunction(node, ast) {
        const scope = node.vScope;
        const name = node.isConstructor ? `constructor` : `function_${node.name}`;
        const funcDef = (0, cloning_1.cloneASTNode)(node, ast);
        // When `node` gets cloned all recursive function calls inside it change their reference
        // to the cloned function `funcDef`, but `funcDef` modifiers are going to be removed, so
        // those function calls should instead reference the modified function which is `node`
        updateReferencesOnRecursiveCalls(funcDef, node);
        funcDef.name = `${nameModifiers_1.ORIGINAL_FUNCTION_PREFIX}${name}_${this.count++}`;
        funcDef.visibility = solc_typed_ast_1.FunctionVisibility.Internal;
        funcDef.isConstructor = false;
        funcDef.kind = solc_typed_ast_1.FunctionKind.Function;
        funcDef.vModifiers = [];
        createOutputCaptures(funcDef, node, ast).forEach(([input, assignment]) => {
            funcDef.vParameters.vParameters.push(input);
            ast.registerChild(input, funcDef.vParameters);
            if (funcDef.vBody !== undefined) {
                funcDef.vBody.insertAtBeginning(assignment);
            }
        });
        scope.insertAtBeginning(funcDef);
        ast.registerChild(funcDef, scope);
        return funcDef;
    }
    getFunctionFromModifier(node, modifier, functionToCall, ast) {
        // First clone the modifier as a whole so all referencedDeclarations are rebound
        const modifierClone = (0, cloning_1.cloneASTNode)(modifier, ast);
        const functionParams = functionToCall.vParameters.vParameters.map((v) => this.createInputParameter(v, ast));
        const retParams = node.vReturnParameters.vParameters.map((v) => this.createReturnParameter(v, ast));
        const retParamList = (0, nodeTemplates_1.createParameterList)(retParams, ast, modifierClone.id);
        ast.context.unregister(modifierClone);
        const modifierAsFunction = new solc_typed_ast_1.FunctionDefinition(modifierClone.id, modifierClone.src, node.scope, solc_typed_ast_1.FunctionKind.Function, `${nameModifiers_1.MODIFIER_PREFIX}${modifier.name}_${node.name}_${this.count++}`, false, // virtual
        solc_typed_ast_1.FunctionVisibility.Internal, node.stateMutability, false, // isConstructor
        (0, nodeTemplates_1.createParameterList)([...modifierClone.vParameters.vParameters, ...functionParams], ast, modifierClone.id), retParamList, [], undefined, modifierClone.vBody);
        node.vScope.insertAtBeginning(modifierAsFunction);
        ast.registerChild(modifierAsFunction, node.vScope);
        if (modifierAsFunction.vBody) {
            new functionModifierInliner_1.FunctionModifierInliner(functionToCall, functionParams, retParamList).dispatchVisit(modifierAsFunction.vBody, ast);
        }
        ast.setContextRecursive(modifierAsFunction);
        return modifierAsFunction;
    }
    createInputParameter(v, ast) {
        const variable = (0, cloning_1.cloneASTNode)(v, ast);
        variable.name = `${nameModifiers_1.MANGLED_PARAMETER}${v.name}${this.count++}`;
        return variable;
    }
    createReturnParameter(v, ast) {
        const param = (0, cloning_1.cloneASTNode)(v, ast);
        param.name = `${nameModifiers_1.MANGLED_RETURN_PARAMETER}${v.name}${this.count++}`;
        return param;
    }
}
exports.FunctionModifierHandler = FunctionModifierHandler;
function createOutputCaptures(func, nodeInSourceUnit, ast) {
    return func.vReturnParameters.vParameters.map((v) => {
        const captureVar = (0, cloning_1.cloneASTNode)(v, ast);
        captureVar.name = `${captureVar.name}_m_capture`;
        return [captureVar, createAssignmentStatement(v, captureVar, ast, nodeInSourceUnit)];
    });
}
function createAssignmentStatement(lhs, rhs, ast, nodeInSourceUnit) {
    const lhsIdentifier = (0, nodeTemplates_1.createIdentifier)(lhs, ast, undefined, nodeInSourceUnit);
    const rhsIdentifier = (0, nodeTemplates_1.createIdentifier)(rhs, ast, undefined, nodeInSourceUnit);
    return (0, nodeTemplates_1.createExpressionStatement)(ast, new solc_typed_ast_1.Assignment(ast.reserveId(), '', lhsIdentifier.typeString, '=', lhsIdentifier, rhsIdentifier));
}
function updateReferencesOnRecursiveCalls(funcDef, functToCall) {
    funcDef
        .getChildren()
        .filter((node) => node instanceof solc_typed_ast_1.FunctionCall)
        .forEach((f) => {
        const refDeclaration = f.vReferencedDeclaration;
        if (refDeclaration !== undefined && refDeclaration.id === funcDef.id) {
            (0, assert_1.default)(canUpdateReference(f.vExpression), `Unexpected expression in ${(0, astPrinter_1.printNode)(f)}`);
            f.vExpression.referencedDeclaration = functToCall.id;
        }
    });
}
function canUpdateReference(node) {
    return node instanceof solc_typed_ast_1.Identifier || node instanceof solc_typed_ast_1.MemberAccess;
}
//# sourceMappingURL=functionModifierHandler.js.map