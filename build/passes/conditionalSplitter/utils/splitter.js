"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitReturnTuple = exports.splitFunctionCallWithReturn = exports.splitFunctionCallWithoutReturn = exports.splitTupleAssignment = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const cloning_1 = require("../../../utils/cloning");
const nodeTemplates_1 = require("../../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const typeConstructs_1 = require("../../../utils/typeConstructs");
const utils_1 = require("../../../utils/utils");
function splitTupleAssignment(node, eGen, ast) {
    const [lhs, rhs] = [node.vLeftHandSide, node.vRightHandSide];
    (0, assert_1.default)(lhs instanceof solc_typed_ast_1.TupleExpression, `Split tuple assignment was called on non-tuple assignment ${node.type} # ${node.id}`);
    const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(rhs, ast.inference);
    (0, assert_1.default)(rhsType instanceof solc_typed_ast_1.TupleType, `Expected rhs of tuple assignment to be tuple type ${(0, astPrinter_1.printNode)(node)}`);
    const block = (0, nodeTemplates_1.createBlock)([], ast);
    const tempVars = new Map(lhs.vOriginalComponents.filter(typeConstructs_1.notNull).map((child, index) => {
        const lhsElementType = (0, nodeTypeProcessing_1.safeGetNodeType)(child, ast.inference);
        const rhsElementType = rhsType.elements[index];
        // We need to calculate a type and location for the temporary variable
        // By default we can use the rhs value, unless it is a literal
        let typeNode;
        let location;
        if (rhsElementType instanceof solc_typed_ast_1.IntLiteralType) {
            [typeNode, location] = (0, solc_typed_ast_1.generalizeType)(lhsElementType);
        }
        else if (rhsElementType instanceof solc_typed_ast_1.StringLiteralType) {
            typeNode = (0, solc_typed_ast_1.generalizeType)(lhsElementType)[0];
            location = solc_typed_ast_1.DataLocation.Memory;
        }
        else {
            [typeNode, location] = (0, solc_typed_ast_1.generalizeType)(rhsElementType);
        }
        const typeName = (0, utils_1.typeNameFromTypeNode)(typeNode, ast);
        const decl = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), node.src, true, // constant
        false, // indexed
        eGen.next().value, block.id, false, // stateVariable
        location ?? solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Default, solc_typed_ast_1.Mutability.Constant, typeNode.pp(), undefined, typeName);
        ast.setContextRecursive(decl);
        return [child, decl];
    }));
    const tempTupleDeclaration = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), node.src, lhs.vOriginalComponents.map((n) => (n === null ? null : tempVars.get(n)?.id ?? null)), [...tempVars.values()], node.vRightHandSide);
    const assignments = [...tempVars.entries()]
        .filter(([_, tempVar]) => tempVar.storageLocation !== solc_typed_ast_1.DataLocation.CallData)
        .map(([target, tempVar]) => new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), node.src, new solc_typed_ast_1.Assignment(ast.reserveId(), node.src, target.typeString, '=', target, (0, nodeTemplates_1.createIdentifier)(tempVar, ast, undefined, node))))
        .reverse();
    block.appendChild(tempTupleDeclaration);
    assignments.forEach((n) => block.appendChild(n));
    ast.setContextRecursive(block);
    return block;
}
exports.splitTupleAssignment = splitTupleAssignment;
function splitFunctionCallWithoutReturn(node, ast) {
    // If returns nothing then the function can be called in a previous statement and
    // replace this call with an empty tuple
    const parent = node.parent;
    (0, assert_1.default)(parent !== undefined, `${(0, astPrinter_1.printNode)(node)} ${node.vFunctionName} has no parent`);
    ast.replaceNode(node, (0, nodeTemplates_1.createEmptyTuple)(ast));
    ast.insertStatementBefore(parent, (0, nodeTemplates_1.createExpressionStatement)(ast, node));
}
exports.splitFunctionCallWithoutReturn = splitFunctionCallWithoutReturn;
function splitFunctionCallWithReturn(node, returnType, eGen, ast) {
    (0, assert_1.default)(returnType.vType !== undefined, 'Return types should not be undefined since solidity 0.5.0');
    const location = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference))[1] ?? solc_typed_ast_1.DataLocation.Default;
    const replacementVariable = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), node.src, true, // constant
    false, // indexed
    eGen.next().value, ast.getContainingScope(node), false, // stateVariable
    location, solc_typed_ast_1.StateVariableVisibility.Private, solc_typed_ast_1.Mutability.Constant, returnType.typeString, undefined, // documentation
    (0, cloning_1.cloneASTNode)(returnType.vType, ast));
    const declaration = (0, nodeTemplates_1.createVariableDeclarationStatement)([replacementVariable], (0, cloning_1.cloneASTNode)(node, ast), ast);
    const temp_var = declaration.vDeclarations[0];
    // a = f() + 5
    // ~>
    // __warp_se = f()
    // a = __warp_se + 5
    ast.insertStatementBefore(node, declaration);
    ast.replaceNode(node, (0, nodeTemplates_1.createIdentifier)(temp_var, ast));
}
exports.splitFunctionCallWithReturn = splitFunctionCallWithReturn;
function splitReturnTuple(node, ast) {
    const returnExpression = node.vExpression;
    (0, assert_1.default)(returnExpression !== undefined, `Tuple return ${(0, astPrinter_1.printNode)(node)} has undefined value. Expects ${node.vFunctionReturnParameters.vParameters.length} parameters`);
    const vars = node.vFunctionReturnParameters.vParameters.map((v) => (0, cloning_1.cloneASTNode)(v, ast));
    const replaceStatement = (0, nodeTemplates_1.createVariableDeclarationStatement)(vars, returnExpression, ast);
    ast.insertStatementBefore(node, replaceStatement);
    node.vExpression = new solc_typed_ast_1.TupleExpression(ast.reserveId(), '', returnExpression.typeString, false, // isInlineArray
    vars.map((v) => (0, nodeTemplates_1.createIdentifier)(v, ast, undefined, node)));
    ast.registerChild(node.vExpression, node);
    return replaceStatement;
}
exports.splitReturnTuple = splitReturnTuple;
//# sourceMappingURL=splitter.js.map