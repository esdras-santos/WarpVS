import { ASTMapper } from '../ast/mapper';
import { AST } from '../ast/ast';
import { InlineAssembly, YulNode } from 'solc-typed-ast';
export declare class InlineAssemblyTransformer extends ASTMapper {
    yul(node: InlineAssembly): YulNode;
    verify(node: InlineAssembly, ast: AST): void;
    transform(node: InlineAssembly, ast: AST): void;
    visitInlineAssembly(node: InlineAssembly, ast: AST): void;
}
//# sourceMappingURL=inlineAssemblyTransformer.d.ts.map