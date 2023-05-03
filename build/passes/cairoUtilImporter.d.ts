import { ElementaryTypeName, Literal, MemberAccess, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class CairoUtilImporter extends ASTMapper {
    private dummySourceUnit;
    addInitialPassPrerequisites(): void;
    visitElementaryTypeName(node: ElementaryTypeName, ast: AST): void;
    visitLiteral(node: Literal, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=cairoUtilImporter.d.ts.map