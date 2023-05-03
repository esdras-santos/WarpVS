import { MemberAccess, Expression } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class BlockMethods extends ASTMapper {
    visitExpression(node: Expression, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=blockMethods.d.ts.map