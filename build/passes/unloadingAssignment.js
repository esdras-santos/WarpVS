"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnloadingAssignment = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const cloning_1 = require("../utils/cloning");
const nameModifiers_1 = require("../utils/nameModifiers");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
class UnloadingAssignment extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.counter = 0;
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitAssignment(node, ast) {
        if (node.operator === '=') {
            return this.visitExpression(node, ast);
        }
        this.extractUnstableSubexpressions(node.vLeftHandSide, ast).forEach((decl) => this.dispatchVisit(decl, ast));
        const lhsValue = (0, cloning_1.cloneASTNode)(node.vLeftHandSide, ast);
        // Extract e.g. "+" from "+="
        const operator = node.operator.slice(0, node.operator.length - 1);
        node.operator = '=';
        ast.replaceNode(node.vRightHandSide, new solc_typed_ast_1.BinaryOperation(ast.reserveId(), node.src, node.typeString, operator, lhsValue, node.vRightHandSide), node);
        this.visitExpression(node, ast);
    }
    visitUnaryOperation(node, ast) {
        if (node.operator !== '++' && node.operator !== '--') {
            return this.commonVisit(node, ast);
        }
        const literalOne = (0, nodeTemplates_1.createNumberLiteral)(1, ast);
        const compoundAssignment = new solc_typed_ast_1.Assignment(node.id, node.src, node.typeString, `${node.operator[0]}=`, node.vSubExpression, literalOne);
        if (!node.prefix) {
            const subtraction = new solc_typed_ast_1.BinaryOperation(node.id, node.src, node.typeString, node.operator === '++' ? '-' : '+', compoundAssignment, (0, cloning_1.cloneASTNode)(literalOne, ast));
            compoundAssignment.id = ast.reserveId();
            ast.replaceNode(node, subtraction);
            this.dispatchVisit(subtraction, ast);
        }
        else {
            ast.replaceNode(node, compoundAssignment);
            this.dispatchVisit(compoundAssignment, ast);
        }
    }
    // node is the lvalue of a compound assignment
    // this function extracts subexpressions that are not guaranteed to produce the same result every time
    // to constants to evaluate once before the assignment
    // this is needed because extracting to a 'constant' and then assigning to it would not modify the correct variable
    // we also extract non-trivial expressions so they're only calculated once, though this is not technically necessary
    // an array of created statements are returned so they can be visited
    extractUnstableSubexpressions(node, ast) {
        if (node instanceof solc_typed_ast_1.IndexAccess) {
            // a[i++] += 1 -> x = i++; a[x] = a[x] + 1
            (0, assert_1.default)(node.vIndexExpression !== undefined, `Unexpected empty index access in compound assignment ${(0, astPrinter_1.printNode)(node)}`);
            if (!(node.vIndexExpression instanceof solc_typed_ast_1.Literal)) {
                const decl = this.extractIndividualSubExpression(node.vIndexExpression, ast);
                return [decl, ...this.extractUnstableSubexpressions(node.vBaseExpression, ast)];
            }
        }
        else if (node instanceof solc_typed_ast_1.MemberAccess) {
            return this.extractUnstableSubexpressions(node.vExpression, ast);
        }
        else if (node instanceof solc_typed_ast_1.FunctionCall) {
            return [this.extractIndividualSubExpression(node, ast)];
        }
        else if (node instanceof solc_typed_ast_1.TupleExpression) {
            (0, assert_1.default)(node.isInlineArray, `unexpected non-inline-array tuple expression in compound assignment ${(0, astPrinter_1.printNode)(node)}`);
            return [this.extractIndividualSubExpression(node, ast)];
        }
        return [];
    }
    extractIndividualSubExpression(node, ast) {
        return ast.extractToConstant(node, (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference), ast), `${nameModifiers_1.COMPOUND_ASSIGNMENT_SUBEXPRESSION_PREFIX}${this.counter++}`)[1];
    }
}
exports.UnloadingAssignment = UnloadingAssignment;
//# sourceMappingURL=unloadingAssignment.js.map