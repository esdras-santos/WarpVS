import { VariableDeclarationStatement, Block, StatementWithChildren, Statement, UncheckedBlock } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class VariableDeclarationExpressionSplitter extends ASTMapper {
    lastUsedConstantId: number;
    addInitialPassPrerequisites(): void;
    generateNewConstantName(): string;
    visitBlock(node: Block, ast: AST): void;
    visitUncheckedBlock(node: UncheckedBlock, ast: AST): void;
    visitStatementList(node: StatementWithChildren<Statement>, ast: AST): void;
    splitDeclaration(node: VariableDeclarationStatement, ast: AST): Statement[];
}
//# sourceMappingURL=variableDeclarationExpressionSplitter.d.ts.map