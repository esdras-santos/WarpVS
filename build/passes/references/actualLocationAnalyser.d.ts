import { DataLocation, Expression, FunctionCall, Identifier, IndexAccess, MemberAccess } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ActualLocationAnalyser extends ASTMapper {
    actualLocations: Map<Expression, DataLocation>;
    constructor(actualLocations: Map<Expression, DataLocation>);
    visitExpression(node: Expression, ast: AST): void;
    visitIdentifier(node: Identifier, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=actualLocationAnalyser.d.ts.map