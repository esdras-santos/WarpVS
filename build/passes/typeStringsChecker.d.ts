import { ElementaryTypeName } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class TypeStringsChecker extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitElementaryTypeName(node: ElementaryTypeName, ast: AST): void;
    static map(ast: AST): AST;
}
//# sourceMappingURL=typeStringsChecker.d.ts.map