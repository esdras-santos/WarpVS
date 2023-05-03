import { ElementaryTypeName, Expression, VariableDeclaration, TypeName, IndexAccess } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class BytesConverter extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitExpression(node: Expression, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitElementaryTypeName(node: ElementaryTypeName, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitTypeName(node: TypeName, ast: AST): void;
}
//# sourceMappingURL=bytesConverter.d.ts.map