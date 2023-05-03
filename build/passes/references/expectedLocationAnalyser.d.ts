import { Assignment, BinaryOperation, DataLocation, Expression, FunctionCall, IfStatement, IndexAccess, MemberAccess, Return, TupleExpression, UnaryOperation, VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoAssert } from '../../ast/cairoNodes';
import { ASTMapper } from '../../ast/mapper';
export declare class ExpectedLocationAnalyser extends ASTMapper {
    private actualLocations;
    private expectedLocations;
    constructor(actualLocations: Map<Expression, DataLocation>, expectedLocations: Map<Expression, DataLocation>);
    visitAssignment(node: Assignment, ast: AST): void;
    visitBinaryOperation(node: BinaryOperation, ast: AST): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
    visitTupleExpression(node: TupleExpression, ast: AST): void;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): void;
    visitCairoAssert(node: CairoAssert, ast: AST): void;
    visitIfStatement(node: IfStatement, ast: AST): void;
}
//# sourceMappingURL=expectedLocationAnalyser.d.ts.map