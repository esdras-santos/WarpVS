import { AST } from '../ast/ast';
import { ContractDefinition, FunctionDefinition, FunctionCall } from 'solc-typed-ast';
import { ASTMapper } from '../ast/mapper';
export declare class ArgBoundChecker extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitContractDefinition(node: ContractDefinition, ast: AST): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=argBoundChecker.d.ts.map