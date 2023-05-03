import { Block, FunctionCall, Identifier, IfStatement, UncheckedBlock, VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
import { CairoFunctionDefinition } from '../ast/cairoNodes';
export declare class IfStatementTempVarPostpender extends ASTMapper {
    private liveVars;
    addInitialPassPrerequisites(): void;
    visitCairoFunctionDefinition(node: CairoFunctionDefinition, ast: AST): void;
    visitIdentifier(node: Identifier, _ast: AST): void;
    visitBlock(node: Block, ast: AST): void;
    visitUncheckedBlock(node: UncheckedBlock, ast: AST): void;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitIfStatement(node: IfStatement, ast: AST): void;
}
//# sourceMappingURL=ifStatementTempVarPostpender.d.ts.map