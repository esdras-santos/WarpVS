import { MemberAccess } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class TypeInformationCalculator extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    private getReplacement;
}
//# sourceMappingURL=typeInformationCalculator.d.ts.map