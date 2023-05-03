import { NewExpression, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
/** Pass that takes all expressions of the form:
 *
 *   `new {salt: salt} Contract(arg1, ..., argn)`
 *
 *   And transpiles them to Cairo `deploy` system call:
 *
 *   `deploy(contract_class_hash, salt, encode(arg1, ... argn), deploy_from_zero)`
 *
 *   -----
 *
 *   Since solidity stores the bytecode of the contract to create, and cairo uses
 *   a declaration address(`class_hash`) of the contract on starknet and the latter
 *   can only be known when interacting with starknet, placeholders are used to
 *   store these hashes, nonetheless at this stage these hashes cannot be known
 *   so they are filled post transpilation.
 *
 *   Salt in solidity is 32 bytes while in Cairo is a felt, so it'll be safely
 *   narrowed down. Notice that values bigger than a felt will result in errors
 *   such as "abc" which in bytes32 representation gets 0x636465...0000 which is
 *   bigger than a felt.
 *
 *   Encode is a util function generated which takes all the transpiled arguments
 *   and makes them a big dynamic arrays of felts. For example arguments:
 *   (a : Uint256, b : felt, c : (felt, felt, felt))
 *   are encoded as (6, [a.low, a.high, b, c[0], c[1], c[2]])
 *
 *   deploy_from_zero is a bool which determines if the deployer's address will
 *   affect the contract address or not. Is set to FALSE by default.
 *
 */
export declare class NewToDeploy extends ASTMapper {
    addInitialPassPrerequisites(): void;
    placeHolderMap: Map<string, VariableDeclaration>;
    visitNewExpression(node: NewExpression, ast: AST): void;
    private createDeploySysCall;
    private createPlaceHolder;
}
//# sourceMappingURL=newToDeploy.d.ts.map