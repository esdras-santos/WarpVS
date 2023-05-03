import { ExpressionStatement, VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
import { TupleExpression } from 'solc-typed-ast';
export declare class TypeNameRemover extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitExpressionStatement(node: ExpressionStatement, ast: AST): void;
    visitTupleExpression(node: TupleExpression, ast: AST): void;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): void;
    isTypeNameType(rhs: TupleExpression | null, index: number, ast: AST): boolean;
}
//# sourceMappingURL=typeNameRemover.d.ts.map