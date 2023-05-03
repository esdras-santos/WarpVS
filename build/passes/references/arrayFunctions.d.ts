import { FunctionCall, MemberAccess } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ReferenceSubPass } from './referenceSubPass';
export declare class ArrayFunctions extends ReferenceSubPass {
    counter: number;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=arrayFunctions.d.ts.map