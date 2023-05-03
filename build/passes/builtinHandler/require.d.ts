import { Expression, ExpressionStatement, Return } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class Require extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitExpressionStatement(node: ExpressionStatement, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
    requireToCairoAssert(expression: Expression | undefined, ast: AST): ExpressionStatement | null;
}
//# sourceMappingURL=require.d.ts.map