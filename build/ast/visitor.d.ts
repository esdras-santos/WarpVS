import { ASTNode, ArrayTypeName, Assignment, BinaryOperation, Block, Break, Conditional, Continue, ContractDefinition, DoWhileStatement, ElementaryTypeName, ElementaryTypeNameExpression, EmitStatement, EnumDefinition, EnumValue, ErrorDefinition, EventDefinition, ExpressionStatement, ForStatement, FunctionCall, FunctionCallOptions, FunctionDefinition, FunctionTypeName, Identifier, IdentifierPath, IfStatement, ImportDirective, IndexAccess, IndexRangeAccess, InheritanceSpecifier, InlineAssembly, Literal, Mapping, MemberAccess, ModifierDefinition, ModifierInvocation, NewExpression, OverrideSpecifier, ParameterList, PlaceholderStatement, PragmaDirective, Return, RevertStatement, SourceUnit, StructDefinition, StructuredDocumentation, Throw, TryCatchClause, TryStatement, TupleExpression, UnaryOperation, UncheckedBlock, UserDefinedTypeName, UserDefinedValueTypeDefinition, UsingForDirective, VariableDeclaration, VariableDeclarationStatement, WhileStatement, TypeName, Expression, Statement, StatementWithChildren, ASTNodeWithChildren } from 'solc-typed-ast';
import { CairoAssert, CairoContract, CairoFunctionDefinition, CairoTempVarStatement } from './cairoNodes';
import { AST } from './ast';
import { CairoGeneratedFunctionDefinition } from './cairoNodes/cairoGeneratedFunctionDefinition';
export declare abstract class ASTVisitor<T> {
    static getPassName(): string;
    dispatchVisit(node: ASTNode, ast: AST): T;
    abstract commonVisit(node: ASTNode, ast: AST): T;
    visitCairoFunctionDefinition(node: CairoFunctionDefinition, ast: AST): T;
    visitCairoGeneratedFunctionDefinition(node: CairoGeneratedFunctionDefinition, ast: AST): T;
    visitCairoTempVar(node: CairoTempVarStatement, ast: AST): T;
    visitElementaryTypeName(node: ElementaryTypeName, ast: AST): T;
    visitArrayTypeName(node: ArrayTypeName, ast: AST): T;
    visitMapping(node: Mapping, ast: AST): T;
    visitUserDefinedTypeName(node: UserDefinedTypeName, ast: AST): T;
    visitFunctionTypeName(node: FunctionTypeName, ast: AST): T;
    visitLiteral(node: Literal, ast: AST): T;
    visitIdentifier(node: Identifier, ast: AST): T;
    visitIdentifierPath(node: IdentifierPath, ast: AST): T;
    visitFunctionCallOptions(node: FunctionCallOptions, ast: AST): T;
    visitFunctionCall(node: FunctionCall, ast: AST): T;
    visitMemberAccess(node: MemberAccess, ast: AST): T;
    visitIndexAccess(node: IndexAccess, ast: AST): T;
    visitIndexRangeAccess(node: IndexRangeAccess, ast: AST): T;
    visitUnaryOperation(node: UnaryOperation, ast: AST): T;
    visitBinaryOperation(node: BinaryOperation, ast: AST): T;
    visitConditional(node: Conditional, ast: AST): T;
    visitElementaryTypeNameExpression(node: ElementaryTypeNameExpression, ast: AST): T;
    visitNewExpression(node: NewExpression, ast: AST): T;
    visitTupleExpression(node: TupleExpression, ast: AST): T;
    visitExpressionStatement(node: ExpressionStatement, ast: AST): T;
    visitAssignment(node: Assignment, ast: AST): T;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): T;
    visitBlock(node: Block, ast: AST): T;
    visitUncheckedBlock(node: UncheckedBlock, ast: AST): T;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): T;
    visitIfStatement(node: IfStatement, ast: AST): T;
    visitForStatement(node: ForStatement, ast: AST): T;
    visitWhileStatement(node: WhileStatement, ast: AST): T;
    visitDoWhileStatement(node: DoWhileStatement, ast: AST): T;
    visitReturn(node: Return, ast: AST): T;
    visitEmitStatement(node: EmitStatement, ast: AST): T;
    visitRevertStatement(node: RevertStatement, ast: AST): T;
    visitPlaceholderStatement(node: PlaceholderStatement, ast: AST): T;
    visitInlineAssembly(node: InlineAssembly, ast: AST): T;
    visitTryCatchClause(node: TryCatchClause, ast: AST): T;
    visitTryStatement(node: TryStatement, ast: AST): T;
    visitBreak(node: Break, ast: AST): T;
    visitContinue(node: Continue, ast: AST): T;
    visitThrow(node: Throw, ast: AST): T;
    visitParameterList(node: ParameterList, ast: AST): T;
    visitModifierInvocation(node: ModifierInvocation, ast: AST): T;
    visitOverrideSpecifier(node: OverrideSpecifier, ast: AST): T;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): T;
    visitModifierDefinition(node: ModifierDefinition, ast: AST): T;
    visitErrorDefinition(node: ErrorDefinition, ast: AST): T;
    visitEventDefinition(node: EventDefinition, ast: AST): T;
    visitStructDefinition(node: StructDefinition, ast: AST): T;
    visitEnumValue(node: EnumValue, ast: AST): T;
    visitEnumDefinition(node: EnumDefinition, ast: AST): T;
    visitUserDefinedValueTypeDefinition(node: UserDefinedValueTypeDefinition, ast: AST): T;
    visitUsingForDirective(node: UsingForDirective, ast: AST): T;
    visitInheritanceSpecifier(node: InheritanceSpecifier, ast: AST): T;
    visitContractDefinition(node: ContractDefinition, ast: AST): T;
    visitStructuredDocumentation(node: StructuredDocumentation, ast: AST): T;
    visitImportDirective(node: ImportDirective, ast: AST): T;
    visitPragmaDirective(node: PragmaDirective, ast: AST): T;
    visitSourceUnit(node: SourceUnit, ast: AST): T;
    visitCairoAssert(node: CairoAssert, ast: AST): T;
    visitTypeName(node: TypeName, ast: AST): T;
    visitExpression(node: Expression, ast: AST): T;
    visitStatement(node: Statement, ast: AST): T;
    visitStatementWithChildren(node: StatementWithChildren<Statement>, ast: AST): T;
    visitASTNodeWithChildren(node: ASTNodeWithChildren<ASTNode>, ast: AST): T;
    visitCairoContract(node: CairoContract, ast: AST): T;
}
//# sourceMappingURL=visitor.d.ts.map