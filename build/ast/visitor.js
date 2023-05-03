"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTVisitor = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("./cairoNodes");
const cairoGeneratedFunctionDefinition_1 = require("./cairoNodes/cairoGeneratedFunctionDefinition");
/*
 Visits every node in a tree in depth first order, calling visitT for each T extends ASTNode
 CommonVisit is abstract to allow the returned value from visiting the child nodes to affect
 the result for the parent
 By default each visitT method calls the visit method for the immediate supertype of T until
 commonVisit is called, this allows methods such as visitExpression to catch all expressions
*/
class ASTVisitor {
    static getPassName() {
        return this.name;
    }
    dispatchVisit(node, ast) {
        let res = null;
        // ASTNodeWithChildren
        if (node instanceof cairoNodes_1.CairoContract)
            res = this.visitCairoContract(node, ast);
        else if (node instanceof solc_typed_ast_1.ContractDefinition)
            res = this.visitContractDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.EnumDefinition)
            res = this.visitEnumDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.OverrideSpecifier)
            res = this.visitOverrideSpecifier(node, ast);
        else if (node instanceof solc_typed_ast_1.ParameterList)
            res = this.visitParameterList(node, ast);
        else if (node instanceof solc_typed_ast_1.SourceUnit)
            res = this.visitSourceUnit(node, ast);
        //  StatementWithChildren
        else if (node instanceof solc_typed_ast_1.Block)
            res = this.visitBlock(node, ast);
        else if (node instanceof solc_typed_ast_1.UncheckedBlock)
            res = this.visitUncheckedBlock(node, ast);
        else if (node instanceof solc_typed_ast_1.StructDefinition)
            res = this.visitStructDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.EnumValue)
            res = this.visitEnumValue(node, ast);
        else if (node instanceof solc_typed_ast_1.ErrorDefinition)
            res = this.visitErrorDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.EventDefinition)
            res = this.visitEventDefinition(node, ast);
        // Expression
        else if (node instanceof solc_typed_ast_1.Assignment)
            res = this.visitAssignment(node, ast);
        else if (node instanceof solc_typed_ast_1.BinaryOperation)
            res = this.visitBinaryOperation(node, ast);
        else if (node instanceof cairoNodes_1.CairoAssert)
            res = this.visitCairoAssert(node, ast);
        else if (node instanceof solc_typed_ast_1.Conditional)
            res = this.visitConditional(node, ast);
        else if (node instanceof solc_typed_ast_1.ElementaryTypeNameExpression)
            res = this.visitElementaryTypeNameExpression(node, ast);
        else if (node instanceof solc_typed_ast_1.FunctionCall)
            res = this.visitFunctionCall(node, ast);
        else if (node instanceof solc_typed_ast_1.FunctionCallOptions)
            res = this.visitFunctionCallOptions(node, ast);
        else if (node instanceof solc_typed_ast_1.IndexAccess)
            res = this.visitIndexAccess(node, ast);
        else if (node instanceof solc_typed_ast_1.IndexRangeAccess)
            res = this.visitIndexRangeAccess(node, ast);
        else if (node instanceof solc_typed_ast_1.MemberAccess)
            res = this.visitMemberAccess(node, ast);
        else if (node instanceof solc_typed_ast_1.NewExpression)
            res = this.visitNewExpression(node, ast);
        //  PrimaryExpression
        else if (node instanceof solc_typed_ast_1.Identifier)
            res = this.visitIdentifier(node, ast);
        else if (node instanceof solc_typed_ast_1.Literal)
            res = this.visitLiteral(node, ast);
        else if (node instanceof solc_typed_ast_1.TupleExpression)
            res = this.visitTupleExpression(node, ast);
        else if (node instanceof solc_typed_ast_1.UnaryOperation)
            res = this.visitUnaryOperation(node, ast);
        else if (node instanceof cairoGeneratedFunctionDefinition_1.CairoGeneratedFunctionDefinition)
            res = this.visitCairoGeneratedFunctionDefinition(node, ast);
        else if (node instanceof cairoNodes_1.CairoFunctionDefinition)
            res = this.visitCairoFunctionDefinition(node, ast);
        else if (node instanceof cairoNodes_1.CairoTempVarStatement)
            res = this.visitCairoTempVar(node, ast);
        else if (node instanceof solc_typed_ast_1.FunctionDefinition)
            res = this.visitFunctionDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.IdentifierPath)
            res = this.visitIdentifierPath(node, ast);
        else if (node instanceof solc_typed_ast_1.ImportDirective)
            res = this.visitImportDirective(node, ast);
        else if (node instanceof solc_typed_ast_1.InheritanceSpecifier)
            res = this.visitInheritanceSpecifier(node, ast);
        else if (node instanceof solc_typed_ast_1.InlineAssembly)
            res = this.visitInlineAssembly(node, ast);
        else if (node instanceof solc_typed_ast_1.ModifierDefinition)
            res = this.visitModifierDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.ModifierInvocation)
            res = this.visitModifierInvocation(node, ast);
        else if (node instanceof solc_typed_ast_1.PragmaDirective)
            res = this.visitPragmaDirective(node, ast);
        // Statement
        else if (node instanceof solc_typed_ast_1.Break)
            res = this.visitBreak(node, ast);
        else if (node instanceof solc_typed_ast_1.Continue)
            res = this.visitContinue(node, ast);
        else if (node instanceof solc_typed_ast_1.DoWhileStatement)
            res = this.visitDoWhileStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.EmitStatement)
            res = this.visitEmitStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.ExpressionStatement)
            res = this.visitExpressionStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.ForStatement)
            res = this.visitForStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.IfStatement)
            res = this.visitIfStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.PlaceholderStatement)
            res = this.visitPlaceholderStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.Return)
            res = this.visitReturn(node, ast);
        else if (node instanceof solc_typed_ast_1.RevertStatement)
            res = this.visitRevertStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.Throw)
            res = this.visitThrow(node, ast);
        else if (node instanceof solc_typed_ast_1.TryCatchClause)
            res = this.visitTryCatchClause(node, ast);
        else if (node instanceof solc_typed_ast_1.TryStatement)
            res = this.visitTryStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.VariableDeclarationStatement)
            res = this.visitVariableDeclarationStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.WhileStatement)
            res = this.visitWhileStatement(node, ast);
        else if (node instanceof solc_typed_ast_1.StructuredDocumentation)
            res = this.visitStructuredDocumentation(node, ast);
        // TypeName
        else if (node instanceof solc_typed_ast_1.ArrayTypeName)
            res = this.visitArrayTypeName(node, ast);
        else if (node instanceof solc_typed_ast_1.ElementaryTypeName)
            res = this.visitElementaryTypeName(node, ast);
        else if (node instanceof solc_typed_ast_1.FunctionTypeName)
            res = this.visitFunctionTypeName(node, ast);
        else if (node instanceof solc_typed_ast_1.Mapping)
            res = this.visitMapping(node, ast);
        else if (node instanceof solc_typed_ast_1.UserDefinedTypeName)
            res = this.visitUserDefinedTypeName(node, ast);
        else if (node instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition)
            res = this.visitUserDefinedValueTypeDefinition(node, ast);
        else if (node instanceof solc_typed_ast_1.UsingForDirective)
            res = this.visitUsingForDirective(node, ast);
        else if (node instanceof solc_typed_ast_1.VariableDeclaration)
            res = this.visitVariableDeclaration(node, ast);
        else {
            (0, assert_1.default)(false, `Unexpected node: ${node.type}`);
        }
        return res;
    }
    visitCairoFunctionDefinition(node, ast) {
        return this.visitFunctionDefinition(node, ast);
    }
    visitCairoGeneratedFunctionDefinition(node, ast) {
        return this.visitCairoFunctionDefinition(node, ast);
    }
    visitCairoTempVar(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitElementaryTypeName(node, ast) {
        return this.visitTypeName(node, ast);
    }
    visitArrayTypeName(node, ast) {
        return this.visitTypeName(node, ast);
    }
    visitMapping(node, ast) {
        return this.visitTypeName(node, ast);
    }
    visitUserDefinedTypeName(node, ast) {
        return this.visitTypeName(node, ast);
    }
    visitFunctionTypeName(node, ast) {
        return this.visitTypeName(node, ast);
    }
    visitLiteral(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitIdentifier(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitIdentifierPath(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitFunctionCallOptions(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitFunctionCall(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitMemberAccess(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitIndexAccess(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitIndexRangeAccess(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitUnaryOperation(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitBinaryOperation(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitConditional(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitElementaryTypeNameExpression(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitNewExpression(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitTupleExpression(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitExpressionStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitAssignment(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitVariableDeclaration(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitBlock(node, ast) {
        return this.visitStatementWithChildren(node, ast);
    }
    visitUncheckedBlock(node, ast) {
        return this.visitStatementWithChildren(node, ast);
    }
    visitVariableDeclarationStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitIfStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitForStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitWhileStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitDoWhileStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitReturn(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitEmitStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitRevertStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitPlaceholderStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitInlineAssembly(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitTryCatchClause(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitTryStatement(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitBreak(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitContinue(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitThrow(node, ast) {
        return this.visitStatement(node, ast);
    }
    visitParameterList(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitModifierInvocation(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitOverrideSpecifier(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitFunctionDefinition(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitModifierDefinition(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitErrorDefinition(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitEventDefinition(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitStructDefinition(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitEnumValue(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitEnumDefinition(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitUserDefinedValueTypeDefinition(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitUsingForDirective(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitInheritanceSpecifier(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitContractDefinition(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitStructuredDocumentation(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitImportDirective(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitPragmaDirective(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitSourceUnit(node, ast) {
        return this.visitASTNodeWithChildren(node, ast);
    }
    visitCairoAssert(node, ast) {
        return this.visitExpression(node, ast);
    }
    visitTypeName(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitExpression(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitStatement(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitStatementWithChildren(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitASTNodeWithChildren(node, ast) {
        return this.commonVisit(node, ast);
    }
    visitCairoContract(node, ast) {
        return this.visitContractDefinition(node, ast);
    }
}
exports.ASTVisitor = ASTVisitor;
//# sourceMappingURL=visitor.js.map