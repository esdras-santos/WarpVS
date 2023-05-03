import { ASTNode, StructuredDocumentation } from 'solc-typed-ast';
import { AST } from '../ast/ast';
export declare function cloneASTNode<T extends ASTNode>(node: T, ast: AST): T;
export declare function cloneDocumentation(node: string | StructuredDocumentation | undefined, ast: AST, remappedIds: Map<number, number>): string | StructuredDocumentation | undefined;
//# sourceMappingURL=cloning.d.ts.map