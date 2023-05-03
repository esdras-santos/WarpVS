import { Assignment, ASTNode, BinaryOperation, Expression, FunctionCall, IndexAccess, Return, TupleExpression, TypeNode, UnaryOperation, VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class ImplicitConversionToExplicit extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitReturn(node: Return, ast: AST): void;
    visitBinaryOperation(node: BinaryOperation, ast: AST): void;
    visitAssignment(node: Assignment, ast: AST): void;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitTupleExpression(node: TupleExpression, ast: AST): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
}
export declare function insertConversionIfNecessary(expression: Expression, targetType: TypeNode, context: ASTNode, ast: AST): void;
//# sourceMappingURL=implicitConversionToExplicit.d.ts.map