import { EmitStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
/**
 * Generates a cairo function that emits an event
 * through a cairo syscall. Then replace the emit statement
 * with a call to the generated function.
 */
export declare class Events extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitEmitStatement(node: EmitStatement, ast: AST): void;
}
//# sourceMappingURL=events.d.ts.map