import { VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class VariableDeclarationInitialiser extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitVariableDeclarationStatement(node: VariableDeclarationStatement, ast: AST): void;
}
//# sourceMappingURL=variableDeclarationInitialiser.d.ts.map