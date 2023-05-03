import { ContractDefinition } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class FreeFunctionInliner extends ASTMapper {
    funcCounter: number;
    addInitialPassPrerequisites(): void;
    visitContractDefinition(node: ContractDefinition, ast: AST): void;
}
//# sourceMappingURL=freeFunctionInliner.d.ts.map