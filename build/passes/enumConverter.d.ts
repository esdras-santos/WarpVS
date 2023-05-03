import { EnumDefinition, Expression, MemberAccess, TypeName, UserDefinedTypeName, VariableDeclaration, FunctionCall } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class EnumConverter extends ASTMapper {
    addInitialPassPrerequisites(): void;
    getEnumValue(node: EnumDefinition, memberName: string): number;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitTypeName(node: TypeName, ast: AST): void;
    visitUserDefinedTypeName(node: UserDefinedTypeName, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitExpression(node: Expression, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=enumConverter.d.ts.map