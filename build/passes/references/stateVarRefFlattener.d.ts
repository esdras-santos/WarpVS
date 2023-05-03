import { MemberAccess } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class StateVarRefFlattener extends ASTMapper {
    visitMemberAccess(node: MemberAccess, ast: AST): void;
}
//# sourceMappingURL=stateVarRefFlattener.d.ts.map