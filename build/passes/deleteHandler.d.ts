import { Return, UnaryOperation } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class DeleteHandler extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
}
//# sourceMappingURL=deleteHandler.d.ts.map