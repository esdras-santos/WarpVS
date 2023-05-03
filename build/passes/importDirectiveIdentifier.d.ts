import { ImportDirective } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class ImportDirectiveIdentifier extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitImportDirective(node: ImportDirective, ast: AST): void;
}
//# sourceMappingURL=importDirectiveIdentifier.d.ts.map