import { UserDefinedTypeName, Identifier, MemberAccess } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ExpressionNameMangler extends ASTMapper {
    visitUserDefinedTypeName(node: UserDefinedTypeName, ast: AST): void;
    visitIdentifier(node: Identifier, _ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=expressionNameMangler.d.ts.map