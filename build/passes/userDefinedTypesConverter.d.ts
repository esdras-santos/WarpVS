import { Expression, FunctionCall, TypeName, UserDefinedTypeName, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class UserDefinedTypesConverter extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitTypeName(node: TypeName, ast: AST): void;
    visitExpression(node: Expression, ast: AST): void;
    visitUserDefinedTypeName(node: UserDefinedTypeName, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    static map(ast: AST): AST;
}
//# sourceMappingURL=userDefinedTypesConverter.d.ts.map