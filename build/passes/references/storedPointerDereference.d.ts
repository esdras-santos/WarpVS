import { Assignment, Expression, IndexAccess, MemberAccess } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ReferenceSubPass } from './referenceSubPass';
export declare class StoredPointerDereference extends ReferenceSubPass {
    visitPotentialStoredPointer(node: Expression, ast: AST): void;
    visitIndexAccess(node: IndexAccess, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitAssignment(node: Assignment, ast: AST): void;
}
//# sourceMappingURL=storedPointerDereference.d.ts.map