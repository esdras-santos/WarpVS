import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class IdentityFunctionRemover extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    isIdentity(node: FunctionDefinition): boolean;
    getArgsOrder(node: FunctionDefinition): number[];
    replaceNodeReferences(node: FunctionDefinition, order: number[], ast: AST): void;
}
//# sourceMappingURL=identityFunctionRemover.d.ts.map