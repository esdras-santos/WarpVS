import { Assignment, FunctionCall } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class ExpressionSplitter extends ASTMapper {
    eGen: Generator<string, string, unknown>;
    addInitialPassPrerequisites(): void;
    visitAssignment(node: Assignment, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    splitSimpleAssignment(node: Assignment, ast: AST): void;
}
//# sourceMappingURL=expressionSplitter.d.ts.map