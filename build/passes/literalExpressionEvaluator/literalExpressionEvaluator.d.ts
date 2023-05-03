import { BinaryOperation, Literal, UnaryOperation } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class LiteralExpressionEvaluator extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitPossibleLiteralExpression(node: UnaryOperation | BinaryOperation | Literal, ast: AST): void;
    visitBinaryOperation(node: BinaryOperation, ast: AST): void;
    visitLiteral(node: Literal, ast: AST): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
}
//# sourceMappingURL=literalExpressionEvaluator.d.ts.map