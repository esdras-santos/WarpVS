import { Break } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class BreakToReturn extends ASTMapper {
    visitBreak(node: Break, ast: AST): void;
}
//# sourceMappingURL=breakToReturn.d.ts.map