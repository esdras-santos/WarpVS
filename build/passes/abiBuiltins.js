"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABIBuiltins = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
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
class ABIBuiltins extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'I', // Implicit conversion to explicit needed to handle literal types (int_const, string_const)
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionCall(node, ast) {
        if (node.kind !== solc_typed_ast_1.FunctionCallKind.FunctionCall ||
            node.vFunctionCallType !== solc_typed_ast_1.ExternalReferenceType.Builtin ||
            !['decode', 'encodePacked', 'encode', 'encodeWithSelector', 'encodeWithSignature'].includes(node.vFunctionName)) {
            return this.visitExpression(node, ast);
        }
        let replacement;
        switch (node.vFunctionName) {
            case 'decode':
                replacement = ast.getUtilFuncGen(node).abi.decode.gen(node.vArguments);
                break;
            case 'encode':
                replacement = ast.getUtilFuncGen(node).abi.encode.gen(node.vArguments);
                break;
            case 'encodePacked':
                replacement = ast.getUtilFuncGen(node).abi.encodePacked.gen(node.vArguments);
                break;
            case 'encodeWithSelector':
                replacement = ast.getUtilFuncGen(node).abi.encodeWithSelector.gen(node.vArguments);
                break;
            case 'encodeWithSignature':
                replacement = ast.getUtilFuncGen(node).abi.encodeWithSignature.gen(node.vArguments);
                break;
            default:
                throw new errors_1.TranspileFailedError(`Unknown abi function: ${node.vFunctionName}`);
        }
        ast.replaceNode(node, replacement);
        this.visitExpression(node, ast);
    }
}
exports.ABIBuiltins = ABIBuiltins;
//# sourceMappingURL=abiBuiltins.js.map