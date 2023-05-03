import { ContractDefinition } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class StorageAllocator extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitContractDefinition(node: ContractDefinition, ast: AST): void;
}
//# sourceMappingURL=storageAllocator.d.ts.map