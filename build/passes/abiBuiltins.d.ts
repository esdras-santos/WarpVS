import { FunctionCall } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
/**
 * Swap any builtin call to abi.encode | encodePacked | encodeWithSelector | encodeWithSignature
 * for a cairo generated one.
 *
 * Warning:
 *
 * Special care needs to be taken when encoding addresses since in Ethereum they
 * take 20 byte but in Starknet they take the whole felt space.
 * An address whose size fits in 20 bytes will have the exact same encoding as
 * solidity, but not the same packed encoding.
 *   - ABI encoding will behave normally since it will have the whole 32 byte slot to
 *   encode the address, but if tried to decode as an address in Ethereum an exception will
 *   be thrown since it won't fit in a Solidity address type
 *   - ABI packed encoding will encode it as 32 bytes instead of the usual 20 bytes, producing
 *   a different result than solidity in all cases where an address is involved.
 */
export declare class ABIBuiltins extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=abiBuiltins.d.ts.map