import { ASTMapper } from '../ast/mapper';
import { AST } from '../ast/ast';
import { FunctionCall } from 'solc-typed-ast';
export declare class NamedArgsRemover extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=namedArgsRemover.d.ts.map