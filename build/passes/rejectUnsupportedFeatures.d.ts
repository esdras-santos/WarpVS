import { ASTNode, ErrorDefinition, EventDefinition, ExpressionStatement, FunctionCall, FunctionCallOptions, FunctionDefinition, Identifier, IndexAccess, MemberAccess, RevertStatement, SourceUnit, TryStatement, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare function checkPath(path: string): boolean;
export declare class RejectUnsupportedFeatures extends ASTMapper {
    unsupportedFeatures: [string, ASTNode][];
    static map(ast: AST): AST;
    addInitialPassPrerequisites(): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitRevertStatement(node: RevertStatement, _ast: AST): void;
    visitErrorDefinition(node: ErrorDefinition, _ast: AST): void;
    visitEventDefinition(node: EventDefinition, ast: AST): void;
    visitFunctionCallOptions(node: FunctionCallOptions, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitExpressionStatement(node: ExpressionStatement, ast: AST): void;
    visitIdentifier(node: Identifier, _ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitTryStatement(node: TryStatement, _ast: AST): void;
    visitSourceUnit(node: SourceUnit, ast: AST): void;
    private functionArgsCheck;
    private checkExternalFunctionCallWithThisOnConstruction;
    private addUnsupported;
}
//# sourceMappingURL=rejectUnsupportedFeatures.d.ts.map