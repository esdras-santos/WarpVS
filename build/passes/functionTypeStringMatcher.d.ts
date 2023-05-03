import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
import { FunctionCall } from 'solc-typed-ast';
export declare class FunctionTypeStringMatcher extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=functionTypeStringMatcher.d.ts.map