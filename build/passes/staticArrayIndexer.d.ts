import { IndexAccess, MemberAccess } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class StaticArrayIndexer extends ASTMapper {
    private staticArrayAccessed;
    addInitialPassPrerequisites(): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    private staticIndexToMemory;
    private setExpressionToMemory;
    private initMemoryArray;
}
//# sourceMappingURL=staticArrayIndexer.d.ts.map