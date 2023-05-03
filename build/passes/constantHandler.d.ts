import { Identifier, MemberAccess, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class ConstantHandler extends ASTMapper {
    addInitialPassPrerequisites(): void;
    isConstant(node: VariableDeclaration): boolean;
    inlineConstant(node: Identifier | MemberAccess, ast: AST): void;
    visitIdentifier(node: Identifier, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=constantHandler.d.ts.map