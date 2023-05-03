"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionSplitter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const cloning_1 = require("../utils/cloning");
const errors_1 = require("../utils/errors");
const nameModifiers_1 = require("../utils/nameModifiers");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
function* expressionGenerator(prefix) {
    const count = (0, utils_1.counterGenerator)();
    while (true) {
        yield `${prefix}${count.next().value}`;
    }
}
class ExpressionSplitter extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.eGen = expressionGenerator(nameModifiers_1.SPLIT_EXPRESSION_PREFIX);
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // Conditionals must have been handled before this pass, otherwise
            // both branches of the conditional might get evaluated when they are
            // extracted by the splitter.
            'Cos',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitAssignment(node, ast) {
        this.commonVisit(node, ast);
        // No need to split if it is a statement
        if (node.parent instanceof solc_typed_ast_1.ExpressionStatement) {
            return;
        }
        // No need to create temp vars for state vars since they
        // are functionalized during the reference pass
        if (node.vLeftHandSide instanceof solc_typed_ast_1.Identifier &&
            identifierReferenceStateVar(node.vLeftHandSide)) {
            return;
        }
        this.splitSimpleAssignment(node, ast);
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        if (!(node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition) ||
            node.parent instanceof solc_typed_ast_1.ExpressionStatement ||
            node.parent instanceof solc_typed_ast_1.VariableDeclarationStatement) {
            return;
        }
        const returnTypes = node.vReferencedDeclaration.vReturnParameters.vParameters;
        if (returnTypes.length === 0) {
            const parent = node.parent;
            (0, assert_1.default)(parent !== undefined, `${(0, astPrinter_1.printNode)(node)} ${node.vFunctionName} has no parent`);
            ast.replaceNode(node, (0, nodeTemplates_1.createEmptyTuple)(ast));
            ast.insertStatementBefore(parent, (0, nodeTemplates_1.createExpressionStatement)(ast, node));
        }
        else if (returnTypes.length === 1) {
            (0, assert_1.default)(returnTypes[0].vType !== undefined, 'Return types should not be undefined since solidity 0.5.0');
            ast.extractToConstant(node, (0, cloning_1.cloneASTNode)(returnTypes[0].vType, ast), this.eGen.next().value);
        }
        else {
            throw new errors_1.TranspileFailedError(`ExpressionSplitter expects functions to have at most 1 return argument. ${(0, astPrinter_1.printNode)(node)} ${node.vFunctionName} has ${returnTypes.length}`);
        }
    }
    splitSimpleAssignment(node, ast) {
        const initialValue = node.vRightHandSide;
        const location = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(initialValue, ast.inference))[1] ?? solc_typed_ast_1.DataLocation.Default;
        let typeName;
        if (node.vLeftHandSide instanceof solc_typed_ast_1.Identifier || node.vLeftHandSide instanceof solc_typed_ast_1.MemberAccess) {
            const sourceDecl = node.vLeftHandSide.vReferencedDeclaration;
            (0, assert_1.default)(sourceDecl instanceof solc_typed_ast_1.VariableDeclaration && sourceDecl.vType !== undefined);
            typeName = (0, cloning_1.cloneASTNode)(sourceDecl.vType, ast);
        }
        else {
            (0, assert_1.default)(node.vLeftHandSide instanceof solc_typed_ast_1.IndexAccess);
            const identifier = getRootIdentifier(node.vLeftHandSide);
            (0, assert_1.default)(identifier instanceof solc_typed_ast_1.Identifier &&
                identifier.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration);
            let originalTypeName;
            const vType = identifier.vReferencedDeclaration.vType;
            if (vType instanceof solc_typed_ast_1.ArrayTypeName) {
                originalTypeName = vType.vBaseType;
            }
            else {
                (0, assert_1.default)(vType instanceof solc_typed_ast_1.Mapping);
                originalTypeName = vType.vValueType;
            }
            typeName = (0, cloning_1.cloneASTNode)(originalTypeName, ast);
        }
        const varDecl = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', // src
        false, // constant
        false, // indexed
        this.eGen.next().value, ast.getContainingScope(node), false, // stateVariable
        location, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Constant, node.vLeftHandSide.typeString, undefined, typeName);
        const tempVarStatement = (0, nodeTemplates_1.createVariableDeclarationStatement)([varDecl], initialValue, ast);
        const tempVar = tempVarStatement.vDeclarations[0];
        const leftHandSide = (0, cloning_1.cloneASTNode)(node.vLeftHandSide, ast);
        const rightHandSide = (0, nodeTemplates_1.createIdentifier)(tempVar, ast, undefined, node);
        const assignment = new solc_typed_ast_1.Assignment(ast.reserveId(), '', // src
        leftHandSide.typeString, '=', // operator
        leftHandSide, rightHandSide);
        const updateVal = (0, nodeTemplates_1.createExpressionStatement)(ast, assignment);
        // b = (a=7) + 4
        // ~>
        // __warp_se = 7
        // a = __warp_se
        // b = (__warp_se) + 4
        ast.insertStatementBefore(node, tempVarStatement);
        ast.insertStatementBefore(node, updateVal);
        ast.replaceNode(node, (0, nodeTemplates_1.createIdentifier)(tempVar, ast));
    }
}
exports.ExpressionSplitter = ExpressionSplitter;
function getRootIdentifier(node) {
    if (node instanceof solc_typed_ast_1.IndexAccess) {
        (0, assert_1.default)(node.vBaseExpression instanceof solc_typed_ast_1.Identifier || node.vBaseExpression instanceof solc_typed_ast_1.IndexAccess);
        return getRootIdentifier(node.vBaseExpression);
    }
    return node;
}
function identifierReferenceStateVar(id) {
    const refDecl = id.vReferencedDeclaration;
    return (refDecl instanceof solc_typed_ast_1.VariableDeclaration &&
        refDecl.getClosestParentByType(solc_typed_ast_1.ContractDefinition)?.id === refDecl.scope);
}
//# sourceMappingURL=expressionSplitter.js.map