import { Assignment } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class TupleFiller extends ASTMapper {
    counter: number;
    visitAssignment(node: Assignment, ast: AST): void;
}
//# sourceMappingURL=tupleFiller.d.ts.map