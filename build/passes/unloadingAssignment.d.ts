import { Assignment, UnaryOperation } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class UnloadingAssignment extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitAssignment(node: Assignment, ast: AST): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
    private extractUnstableSubexpressions;
    counter: number;
    private extractIndividualSubExpression;
}
//# sourceMappingURL=unloadingAssignment.d.ts.map