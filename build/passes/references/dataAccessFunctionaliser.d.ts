import { Assignment, Identifier, IndexAccess, MemberAccess, FunctionCall, Expression } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ReferenceSubPass } from './referenceSubPass';
export declare class DataAccessFunctionaliser extends ReferenceSubPass {
    visitExpression(node: Expression, ast: AST): void;
    visitAssignment(node: Assignment, ast: AST): void;
    visitIdentifier(node: Identifier, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
}
//# sourceMappingURL=dataAccessFunctionaliser.d.ts.map