import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class RefTypeModifier extends ASTMapper {
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
}
//# sourceMappingURL=memoryRefInputModifier.d.ts.map