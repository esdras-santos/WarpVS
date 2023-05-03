import { TupleExpression } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class TupleFlattener extends ASTMapper {
    visitTupleExpression(node: TupleExpression, ast: AST): void;
}
//# sourceMappingURL=tupleFlattener.d.ts.map