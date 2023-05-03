import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
import { Identifier } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../ast/cairoNodes';
/**
 * This pass replaces all identifier whose referenced declaration defined outside of the function body,
 * by a member access with the expression as an identifier referenced to it's parent contract.
 * For e.g.
 *        contract A {
 *           uint public a;
 *           function f() public view {
 *              uint b = a;   // would be replace with A.a
 *              g();          // would be replaced with A.g()
 *           }
 *        }
 *     -- function f to be written outside of namespace A (see `cairoWriter.ts: 519`) --
 * This is done to separate the external functions outside of the namespace
 * so that there would be abi's generated for them. see `cairoWriter.ts: 519`.
 * from cairo v0.10.0, for the functions lying inside the cairo namespace , there would be
 * no abi generated for them.
 */
export declare class ReplaceIdentifierContractMemberAccess extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitCairoFunctionDefinition(node: CairoFunctionDefinition, ast: AST): void;
    visitIdentifier(node: Identifier, ast: AST): void;
}
//# sourceMappingURL=replaceIdentifierContractMemberAccess.d.ts.map