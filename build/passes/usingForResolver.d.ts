import { FunctionCall } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class UsingForResolver extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=usingForResolver.d.ts.map