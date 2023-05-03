"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiteralWriter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../../utils/errors");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const export_1 = require("../../export");
class LiteralWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _) {
        const type = (0, utils_1.primitiveTypeToCairo)(node.typeString);
        switch (node.kind) {
            case solc_typed_ast_1.LiteralKind.Number:
                if ((0, utils_1.isCairoPrimitiveIntType)(type)) {
                    if (type === export_1.CairoUint256.toString()) {
                        const [high, low] = (0, export_1.divmod)(BigInt(node.value), BigInt(Math.pow(2, 128)));
                        return [`u256_from_felts( ${low}, ${high} )`];
                    }
                    return [`${node.value}_${type}`];
                }
                else if (type === 'ContractAddress') {
                    return [`starknet::contract_address_const::<${node.value}>()`];
                }
                else if (type === 'felt') {
                    return [node.value];
                }
                else {
                    throw new errors_1.TranspileFailedError(`Attempted to write unexpected cairo type: ${type}`);
                }
            case solc_typed_ast_1.LiteralKind.Bool:
                return [node.value];
            case solc_typed_ast_1.LiteralKind.String:
            case solc_typed_ast_1.LiteralKind.UnicodeString: {
                if (node.value.length === node.hexValue.length / 2 &&
                    node.value.length < 32 &&
                    node.value.split('').every((v) => v.charCodeAt(0) < 127)) {
                    return [`'${node.value}'`];
                }
                return [`0x${node.hexValue}`];
            }
            case solc_typed_ast_1.LiteralKind.HexString:
                if ((0, utils_1.isCairoPrimitiveIntType)(type)) {
                    if (type === export_1.CairoUint256.toString()) {
                        return [
                            `u256_from_felts( ${node.hexValue.slice(32, 64)}, ${node.hexValue.slice(0, 32)} )`,
                        ];
                    }
                    return [`0x${node.hexValue}_${type}`];
                }
                else if (type === 'ContractAddress') {
                    return [`starknet::contract_address_const::<${node.hexValue}>()`];
                }
                else if (type === 'felt') {
                    return [`0x${node.hexValue}`];
                }
                else {
                    throw new errors_1.TranspileFailedError('Attempted to write unexpected cairo type');
                }
        }
    }
}
exports.LiteralWriter = LiteralWriter;
//# sourceMappingURL=literalWriter.js.map