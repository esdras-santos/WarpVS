import { AST } from '../../ast/ast';
import { CairoContract } from '../../ast/cairoNodes';
import { ASTMapper } from '../../ast/mapper';
export declare class InheritanceInliner extends ASTMapper {
    counter: number;
    addInitialPassPrerequisites(): void;
    visitCairoContract(node: CairoContract, ast: AST): void;
    static map(ast: AST): AST;
    generateIndex(): number;
}
//# sourceMappingURL=inheritanceInliner.d.ts.map