import { ASTNode } from 'solc-typed-ast';
import { AST } from './ast';
import { ASTVisitor } from './visitor';
export declare class ASTMapper extends ASTVisitor<void> {
    prerequisites: Set<string>;
    addPassPrerequisite(pass_key: string): void;
    addInitialPassPrerequisites(): void;
    getPassPrerequisites(): Set<string>;
    static _getPassPrerequisites(): Set<string>;
    commonVisit(node: ASTNode, ast: AST): void;
    static map(ast: AST): AST;
}
//# sourceMappingURL=mapper.d.ts.map