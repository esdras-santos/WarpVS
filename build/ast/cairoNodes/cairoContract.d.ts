import { ASTNode, ContractDefinition, ContractKind, StructuredDocumentation, VariableDeclaration } from 'solc-typed-ast';
export declare class CairoContract extends ContractDefinition {
    dynamicStorageAllocations: Map<VariableDeclaration, number>;
    staticStorageAllocations: Map<VariableDeclaration, number>;
    usedStorage: number;
    usedIds: number;
    constructor(id: number, src: string, name: string, scope: number, kind: ContractKind, abstract: boolean, fullyImplemented: boolean, linearizedBaseContracts: number[], usedErrors: number[], dynamicStorageAllocations: Map<VariableDeclaration, number>, staticStorageAllocations: Map<VariableDeclaration, number>, usedStorage: number, usedStoredPointerIds: number, documentation?: string | StructuredDocumentation, children?: Iterable<ASTNode>, nameLocation?: string, raw?: unknown);
}
//# sourceMappingURL=cairoContract.d.ts.map