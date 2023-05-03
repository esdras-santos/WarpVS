"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnToBreak = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const cloning_1 = require("../../utils/cloning");
const utils_1 = require("../../utils/utils");
const nameModifiers_1 = require("../../utils/nameModifiers");
class ReturnToBreak extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.returnFlags = new Map();
        this.returnVariables = new Map();
        this.currentOuterLoop = null;
    }
    visitFunctionDefinition(node, ast) {
        if (!node.vBody)
            return;
        const loopsWithReturns = node.getChildrenBySelector((n) => (n instanceof solc_typed_ast_1.WhileStatement || n instanceof solc_typed_ast_1.DoWhileStatement) &&
            n.getChildren().some((n) => n instanceof solc_typed_ast_1.Return));
        if (loopsWithReturns.length > 0) {
            const retVars = insertReturnValueDeclaration(node.vBody, ast);
            this.returnVariables.set(node, retVars);
            this.commonVisit(node, ast);
        }
    }
    visitLoop(node, ast) {
        if (this.currentOuterLoop === null) {
            if (node.getChildren().some((n) => n instanceof solc_typed_ast_1.Return)) {
                // Create variables to store the values to return,
                // a flag for whether the loop was broken because of a return,
                // and a handler block to return those variables
                const retFlag = this.createReturnFlag(node, ast);
                const retVars = this.getReturnVariables(node);
                insertOuterLoopRetFlagCheck(node, retFlag, retVars, ast);
                this.currentOuterLoop = node;
                this.commonVisit(node, ast);
                this.currentOuterLoop = null;
            }
        }
        else {
            if (node.getChildren().some((n) => n instanceof solc_typed_ast_1.Return)) {
                // Retrieve the flag variable declared for the outermost loop
                // and a a block to the outer loop to break again if it's true
                const retFlag = this.getReturnFlag(this.currentOuterLoop);
                insertInnerLoopRetFlagCheck(node, retFlag, ast);
                this.commonVisit(node, ast);
            }
        }
    }
    visitWhileStatement(node, ast) {
        this.visitLoop(node, ast);
    }
    visitDoWhileStatement(node, ast) {
        this.visitLoop(node, ast);
    }
    visitReturn(node, ast) {
        //We only want to process returns inside loops
        if (this.currentOuterLoop) {
            const retVars = this.getReturnVariables(node);
            storeRetValues(node, retVars, ast);
            const retFlag = this.getReturnFlag(this.currentOuterLoop);
            replaceWithBreak(node, retFlag, ast);
        }
    }
    createReturnFlag(containingWhile, ast) {
        const decl = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
        false, // indexed
        `${nameModifiers_1.RETURN_FLAG_PREFIX}${this.returnFlags.size}`, ast.getContainingScope(containingWhile), false, // stateVariable
        solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Default, solc_typed_ast_1.Mutability.Mutable, 'bool', undefined, (0, nodeTemplates_1.createBoolTypeName)(ast));
        const declStatement = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', [decl.id], [decl], (0, nodeTemplates_1.createBoolLiteral)(false, ast));
        ast.insertStatementBefore(containingWhile, declStatement);
        this.returnFlags.set(containingWhile, decl);
        return decl;
    }
    getReturnFlag(whileStatement) {
        const existing = this.returnFlags.get(whileStatement);
        (0, assert_1.default)(existing !== undefined, `${(0, astPrinter_1.printNode)(whileStatement)} has no return flag`);
        return existing;
    }
    getReturnVariables(node) {
        const containingFunction = (0, utils_1.getContainingFunction)(node);
        const retVars = this.returnVariables.get(containingFunction);
        (0, assert_1.default)(retVars !== undefined, `Could not find return variables for ${(0, astPrinter_1.printNode)(node)}`);
        return retVars;
    }
}
exports.ReturnToBreak = ReturnToBreak;
let retVarCounter = 0;
function insertReturnValueDeclaration(node, ast) {
    const containingFunction = (0, utils_1.getContainingFunction)(node);
    if (containingFunction.vReturnParameters.vParameters.length === 0) {
        return [];
    }
    const declarations = containingFunction.vReturnParameters.vParameters.map((v) => (0, cloning_1.cloneASTNode)(v, ast));
    declarations.forEach((v) => (v.name = `${nameModifiers_1.RETURN_VALUE_PREFIX}${retVarCounter++}`));
    const declarationStatement = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', declarations.map((n) => n.id), declarations);
    node.insertAtBeginning(declarationStatement);
    ast.registerChild(declarationStatement, node);
    return declarations;
}
function insertOuterLoopRetFlagCheck(node, retFlag, retVars, ast) {
    const containingFunction = (0, utils_1.getContainingFunction)(node);
    ast.insertStatementAfter(node, new solc_typed_ast_1.IfStatement(ast.reserveId(), '', (0, nodeTemplates_1.createIdentifier)(retFlag, ast), (0, nodeTemplates_1.createReturn)(retVars, containingFunction.vReturnParameters.id, ast)));
}
function insertInnerLoopRetFlagCheck(node, retFlag, ast) {
    ast.insertStatementAfter(node, new solc_typed_ast_1.IfStatement(ast.reserveId(), '', (0, nodeTemplates_1.createIdentifier)(retFlag, ast), new solc_typed_ast_1.Break(ast.reserveId(), '')));
}
function replaceWithBreak(node, retFlag, ast) {
    ast.insertStatementBefore(node, new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), '', new solc_typed_ast_1.Assignment(ast.reserveId(), '', 'bool', '=', (0, nodeTemplates_1.createIdentifier)(retFlag, ast), (0, nodeTemplates_1.createBoolLiteral)(true, ast))));
    ast.replaceNode(node, new solc_typed_ast_1.Break(ast.reserveId(), node.src, node.documentation, node.raw));
}
function storeRetValues(node, retVars, ast) {
    if (!node.vExpression)
        return;
    const lhs = (0, utils_1.toSingleExpression)(retVars.map((v) => (0, nodeTemplates_1.createIdentifier)(v, ast)), ast);
    const valueCapture = new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), '', new solc_typed_ast_1.Assignment(ast.reserveId(), '', lhs.typeString, '=', lhs, node.vExpression));
    ast.insertStatementBefore(node, valueCapture);
}
//# sourceMappingURL=returnToBreak.js.map