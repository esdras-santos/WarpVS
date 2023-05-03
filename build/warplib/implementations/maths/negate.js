"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseNegate = exports.negate = void 0;
const utils_1 = require("../../utils");
// This satisfies the solidity convention of -type(intX).min = type(intX).min
function negate() {
    return {
        fileName: 'negate',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.uint256 import Uint256, uint256_neg',
        ],
        functions: (0, utils_1.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    'func warp_negate256{range_check_ptr}(op : Uint256) -> (res : Uint256){',
                    '    let (res) = uint256_neg(op);',
                    '    return (res,);',
                    '}',
                ].join('\n');
            }
            else {
                // Could also have if op == 0: 0 else limit-op
                return [
                    `func warp_negate${width}{bitwise_ptr : BitwiseBuiltin*}(op : felt) -> (res : felt){`,
                    `    let raw_res = ${(0, utils_1.bound)(width)} - op;`,
                    `    let (res) = bitwise_and(raw_res, ${(0, utils_1.mask)(width)});`,
                    `    return (res,);`,
                    `}`,
                ].join('\n');
            }
        }),
    };
}
exports.negate = negate;
function functionaliseNegate(node, ast) {
    (0, utils_1.IntFunction)(node, node.vSubExpression, 'negate', 'negate', ast);
}
exports.functionaliseNegate = functionaliseNegate;
//# sourceMappingURL=negate.js.map