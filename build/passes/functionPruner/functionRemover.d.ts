import { ContractDefinition, FunctionDefinition, SourceUnit } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class FunctionRemover extends ASTMapper {
    private functionGraph;
    private reachableFunctions;
    constructor(graph: Map<number, FunctionDefinition[]>);
    visitSourceUnit(node: SourceUnit, ast: AST): void;
    visitContractDefinition(node: ContractDefinition, _ast: AST): void;
    dfs(f: FunctionDefinition): void;
}
//# sourceMappingURL=functionRemover.d.ts.map