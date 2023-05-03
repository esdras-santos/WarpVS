import { FunctionDefinition, Statement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class UnreachableStatementPruner extends ASTMapper {
    reachableStatements: Set<Statement>;
    addInitialPassPrerequisites(): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitStatement(node: Statement, ast: AST): void;
}
//# sourceMappingURL=unreachableStatementPruner.d.ts.map