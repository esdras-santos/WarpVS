import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { CairoFunctionDefinition } from '../ast/cairoNodes';
import { ASTMapper } from '../ast/mapper';
export declare class AnnotateImplicits extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitCairoFunctionDefinition(node: CairoFunctionDefinition, ast: AST): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
}
//# sourceMappingURL=annotateImplicits.d.ts.map