import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class DynArrayModifier extends ASTMapper {
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    private genStructConstructor;
}
//# sourceMappingURL=dynamicArrayModifier.d.ts.map