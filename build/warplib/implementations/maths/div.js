"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseDiv = exports.div_signed_unsafe = exports.div_signed = void 0;
const utils_1 = require("../../../utils/utils");
const utils_2 = require("../../utils");
function div_signed() {
    return {
        fileName: 'div_signed',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.uint256 import Uint256, uint256_signed_div_rem, uint256_eq',
            'from warplib.maths.utils import felt_to_uint256',
            `from warplib.maths.int_conversions import ${(0, utils_1.mapRange)(31, (n) => `warp_int${8 * n + 8}_to_int256`).join(', ')}, ${(0, utils_1.mapRange)(31, (n) => `warp_int256_to_int${8 * n + 8}`).join(', ')}`,
            `from warplib.maths.mul_signed import ${(0, utils_1.mapRange)(32, (n) => `warp_mul_signed${8 * n + 8}`)}`,
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    'func warp_div_signed256{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(lhs : Uint256, rhs : Uint256) -> (res : Uint256){',
                    `    if (rhs.high == 0 and rhs.low == 0){`,
                    `       with_attr error_message("Division by zero error"){`,
                    `          assert 1 = 0;`,
                    `       }`,
                    `    }`,
                    `    let (is_minus_one) = uint256_eq(rhs, Uint256(${(0, utils_2.mask)(128)}, ${(0, utils_2.mask)(128)}));`,
                    `    if (is_minus_one == 1){`,
                    '        let (res : Uint256) = warp_mul_signed256(lhs, rhs);',
                    '        return (res,);',
                    '    }',
                    '    let (res : Uint256, _) = uint256_signed_div_rem(lhs, rhs);',
                    '    return (res,);',
                    '}',
                ].join('\n');
            }
            else {
                return [
                    `func warp_div_signed${width}{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(lhs : felt, rhs : felt) -> (res : felt){`,
                    `    alloc_locals;`,
                    `    if (rhs == 0){`,
                    `        with_attr error_message("Division by zero error"){`,
                    `            assert 1 = 0;`,
                    `        }`,
                    `    }`,
                    `    if (rhs == ${(0, utils_2.mask)(width)}){`,
                    `        let (res : felt) = warp_mul_signed${width}(lhs, rhs);`,
                    `        return (res,);`,
                    '    }',
                    `    let (local lhs_256) = warp_int${width}_to_int256(lhs);`,
                    `    let (rhs_256) = warp_int${width}_to_int256(rhs);`,
                    '    let (res256, _) = uint256_signed_div_rem(lhs_256, rhs_256);',
                    `    let (truncated) = warp_int256_to_int${width}(res256);`,
                    `    return (truncated,);`,
                    '}',
                ].join('\n');
            }
        }),
    };
}
exports.div_signed = div_signed;
function div_signed_unsafe() {
    return {
        fileName: 'div_signed_unsafe',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.uint256 import Uint256, uint256_signed_div_rem, uint256_eq',
            'from warplib.maths.utils import felt_to_uint256',
            `from warplib.maths.int_conversions import ${(0, utils_1.mapRange)(31, (n) => `warp_int${8 * n + 8}_to_int256`).join(', ')}, ${(0, utils_1.mapRange)(31, (n) => `warp_int256_to_int${8 * n + 8}`).join(', ')}`,
            `from warplib.maths.mul_signed_unsafe import ${(0, utils_1.mapRange)(32, (n) => `warp_mul_signed_unsafe${8 * n + 8}`)}`,
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    'func warp_div_signed_unsafe256{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(lhs : Uint256, rhs : Uint256) -> (res : Uint256){',
                    `    if (rhs.high == 0 and rhs.low == 0){`,
                    `        with_attr error_message("Division by zero error"){`,
                    `           assert 1 = 0;`,
                    `        }`,
                    `    }`,
                    `    let (is_minus_one) = uint256_eq(rhs, Uint256(${(0, utils_2.mask)(128)}, ${(0, utils_2.mask)(128)}));`,
                    `    if (is_minus_one == 1){`,
                    '        let (res : Uint256) = warp_mul_signed_unsafe256(lhs, rhs);',
                    '        return (res,);',
                    '    }',
                    '    let (res : Uint256, _) = uint256_signed_div_rem(lhs, rhs);',
                    '    return (res,);',
                    '}',
                ].join('\n');
            }
            else {
                return [
                    `func warp_div_signed_unsafe${width}{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(lhs : felt, rhs : felt) -> (res : felt){`,
                    `    alloc_locals;`,
                    `    if (rhs == 0){`,
                    `        with_attr error_message("Division by zero error"){`,
                    `            assert 1 = 0;`,
                    `        }`,
                    `    }`,
                    `    if (rhs == ${(0, utils_2.mask)(width)}){`,
                    `        let (res : felt) = warp_mul_signed_unsafe${width}(lhs, rhs);`,
                    `        return (res,);`,
                    '    }',
                    `    let (local lhs_256) = warp_int${width}_to_int256(lhs);`,
                    `    let (rhs_256) = warp_int${width}_to_int256(rhs);`,
                    '    let (res256, _) = uint256_signed_div_rem(lhs_256, rhs_256);',
                    `    let (truncated) = warp_int256_to_int${width}(res256);`,
                    `    return (truncated,);`,
                    '}',
                ].join('\n');
            }
        }),
    };
}
exports.div_signed_unsafe = div_signed_unsafe;
function functionaliseDiv(node, unsafe, ast) {
    (0, utils_2.IntxIntFunction)(node, 'div', 'signedOrWide', true, unsafe, ast);
}
exports.functionaliseDiv = functionaliseDiv;
//# sourceMappingURL=div.js.map