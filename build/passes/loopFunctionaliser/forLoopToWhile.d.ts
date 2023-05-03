import { Continue, ForStatement } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ForLoopToWhile extends ASTMapper {
    visitForStatement(node: ForStatement, ast: AST): void;
    visitContinue(node: Continue, ast: AST): void;
}
//# sourceMappingURL=forLoopToWhile.d.ts.map