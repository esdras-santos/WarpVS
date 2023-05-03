"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseShr = exports.shr_signed = exports.shr = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const importPaths_1 = require("../../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const utils_1 = require("../../../utils/utils");
const utils_2 = require("../../utils");
function shr() {
    return {
        fileName: 'shr',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and, bitwise_not',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.math_cmp import is_le, is_le_felt',
            'from starkware.cairo.common.uint256 import Uint256, uint256_and',
            'from warplib.maths.pow2 import pow2',
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    `func warp_shr256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : felt) -> (`,
                    `        result : Uint256){`,
                    `    let le_127 = is_le(rhs, 127);`,
                    `    if (le_127 == 1){`,
                    `        // (h', l') := (h, l) >> rhs`,
                    `        // p := 2^rhs`,
                    `        // l' = ((h & (p-1)) << (128 - rhs)) + ((l&~(p-1)) >> rhs)`,
                    `        //    = ((h & (p-1)) << 128 >> rhs) + ((l&~(p-1)) >> rhs)`,
                    `        //    = (h & (p-1)) * 2^128 / p + (l&~(p-1)) / p`,
                    `        //    = (h & (p-1) * 2^128 + l&~(p-1)) / p`,
                    `        // h' = h >> rhs = (h - h&(p-1)) / p`,
                    `        let (p) = pow2(rhs);`,
                    `        let (low_mask) = bitwise_not(p - 1);`,
                    `        let (low_part) = bitwise_and(lhs.low, low_mask);`,
                    `        let (high_part) = bitwise_and(lhs.high, p - 1);`,
                    `        return (`,
                    `            Uint256(low=(low_part + ${(0, utils_2.bound)(128)} * high_part) / p, high=(lhs.high - high_part) / p),);`,
                    `    }`,
                    `    let le_255 = is_le(rhs, 255);`,
                    `    if (le_255 == 1){`,
                    `        let (p) = pow2(rhs - 128);`,
                    `        let (mask) = bitwise_not(p - 1);`,
                    `        let (res) = bitwise_and(lhs.high, mask);`,
                    `        return (Uint256(res / p, 0),);`,
                    `    }`,
                    `    return (Uint256(0, 0),);`,
                    `}`,
                    `func warp_shr256_256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : Uint256) -> (`,
                    `        result : Uint256){`,
                    `    if (rhs.high != 0){`,
                    `        return (Uint256(0, 0),);`,
                    `    }`,
                    `    let le_127 = is_le(rhs.low, 127);`,
                    `    if (le_127 == 1){`,
                    `        // (h', l') := (h, l) >> rhs`,
                    `        // p := 2^rhs`,
                    `        // l' = ((h & (p-1)) << (128 - rhs)) + ((l&~(p-1)) >> rhs)`,
                    `        //    = ((h & (p-1)) << 128 >> rhs) + ((l&~(p-1)) >> rhs)`,
                    `        //    = (h & (p-1)) * 2^128 / p + (l&~(p-1)) / p`,
                    `        //    = (h & (p-1) * 2^128 + l&~(p-1)) / p`,
                    `        // h' = h >> rhs = (h - h&(p-1)) / p`,
                    `        let (p) = pow2(rhs.low);`,
                    `        let (low_mask) = bitwise_not(p - 1);`,
                    `        let (low_part) = bitwise_and(lhs.low, low_mask);`,
                    `        let (high_part) = bitwise_and(lhs.high, p - 1);`,
                    `        return (`,
                    `            Uint256(low=(low_part + ${(0, utils_2.bound)(128)} * high_part) / p, high=(lhs.high - high_part) / p),);`,
                    `    }`,
                    `    let le_255 = is_le(rhs.low, 255);`,
                    `    if (le_255 == 1){`,
                    `        let (p) = pow2(rhs.low - 128);`,
                    `        let (mask) = bitwise_not(p - 1);`,
                    `        let (res) = bitwise_and(lhs.high, mask);`,
                    `        return (Uint256(res / p, 0),);`,
                    `    }`,
                    `    return (Uint256(0, 0),);`,
                    `}`,
                ].join('\n');
            }
            else {
                return [
                    `func warp_shr${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : felt) -> (res : felt){`,
                    `    let large_shift = is_le_felt(${width}, rhs);`,
                    `    if (large_shift == 1){`,
                    `        return (0,);`,
                    `    }else{`,
                    `        let preserved_width = ${width} - rhs;`,
                    `        let (preserved_bound) = pow2(preserved_width);`,
                    `        let mask = preserved_bound - 1;`,
                    `        let (divisor) = pow2(rhs);`,
                    `        let shifted_mask = mask * divisor;`,
                    `        let (lhs_truncated) = bitwise_and(lhs, shifted_mask);`,
                    `        return (lhs_truncated / divisor , );`,
                    `    }`,
                    `}`,
                    `func warp_shr${width}_256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : Uint256) -> (res : felt){`,
                    `    if (rhs.high == 0){`,
                    `        let (res,) = warp_shr${width}(lhs, rhs.low);`,
                    `        return (res,);`,
                    `    }else{`,
                    `        return (0,);`,
                    `    }`,
                    `}`,
                ].join('\n');
            }
        }),
    };
}
exports.shr = shr;
function shr_signed() {
    return {
        fileName: 'shr_signed',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.math_cmp import is_le, is_le_felt',
            'from starkware.cairo.common.uint256 import Uint256, uint256_and',
            'from warplib.maths.pow2 import pow2',
            `from warplib.maths.shr import ${(0, utils_1.mapRange)(32, (n) => `warp_shr${8 * n + 8}`).join(', ')}`,
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    `func warp_shr_signed256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : felt) -> (res : Uint256){`,
                    `    alloc_locals;`,
                    `    let (local lhs_msb) = bitwise_and(lhs.high, ${(0, utils_2.msb)(128)});`,
                    `    let (logical_shift) = warp_shr256(lhs, rhs);`,
                    `    if (lhs_msb == 0){`,
                    `        return (logical_shift,);`,
                    `    }else{`,
                    `        let large_shift = is_le(${width}, rhs);`,
                    `        if (large_shift == 1){`,
                    `            return (Uint256(${(0, utils_2.mask)(128)}, ${(0, utils_2.mask)(128)}),);`,
                    `        }else{`,
                    `            let crosses_boundary = is_le(128, rhs);`,
                    `            if (crosses_boundary == 1){`,
                    `                let (bound) = pow2(rhs-128);`,
                    `                let ones = bound - 1;`,
                    `                let (shift) = pow2(256-rhs);`,
                    `                return (Uint256(logical_shift.low+ones*shift, ${(0, utils_2.mask)(128)}),);`,
                    `            }else{`,
                    `                let (bound) = pow2(rhs);`,
                    `                let ones = bound - 1;`,
                    `                let (shift) = pow2(128-rhs);`,
                    `                return (Uint256(logical_shift.low, logical_shift.high+ones*shift),);`,
                    `            }`,
                    `        }`,
                    `    }`,
                    `}`,
                    `func warp_shr_signed256_256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : Uint256) -> (res : Uint256){`,
                    `    if (rhs.high == 0){`,
                    `        let (res) = warp_shr_signed256(lhs, rhs.low);`,
                    `        return (res,);`,
                    `    }else{`,
                    `        let (res) = warp_shr_signed256(lhs, 256);`,
                    `        return (res,);`,
                    `    }`,
                    `}`,
                ].join('\n');
            }
            else {
                return [
                    `func warp_shr_signed${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : felt) -> (res : felt){`,
                    `    alloc_locals;`,
                    `    let (local lhs_msb) = bitwise_and(lhs, ${(0, utils_2.msb)(width)});`,
                    `    local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr;`,
                    `    if (lhs_msb == 0){`,
                    `        let (res) = warp_shr${width}(lhs, rhs);`,
                    `        return (res,);`,
                    `    }else{`,
                    `        let large_shift = is_le_felt(${width}, rhs);`,
                    `        if (large_shift == 1){`,
                    `            return (${(0, utils_2.mask)(width)},);`,
                    `        }else{`,
                    `            let (shifted) = warp_shr${width}(lhs, rhs);`,
                    `            let (sign_extend_bound) = pow2(rhs);`,
                    `            let sign_extend_value = sign_extend_bound - 1;`,
                    `            let (sign_extend_multiplier) = pow2(${width} - rhs);`,
                    `            return (shifted + sign_extend_value * sign_extend_multiplier,);`,
                    `        }`,
                    `    }`,
                    `}`,
                    `func warp_shr_signed${width}_256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : Uint256) -> (res : felt){`,
                    `    if (rhs.high == 0){`,
                    `        let (res) = warp_shr${width}(lhs, rhs.low);`,
                    `        return (res,);`,
                    `    }else{`,
                    `        let (res) = warp_shr${width}(lhs, ${width});`,
                    `        return (res,);`,
                    `    }`,
                    `}`,
                ].join('\n');
            }
        }),
    };
}
exports.shr_signed = shr_signed;
function functionaliseShr(node, ast) {
    const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
    const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(lhsType instanceof solc_typed_ast_1.IntType || lhsType instanceof solc_typed_ast_1.FixedBytesType, `lhs of >> ${(0, astPrinter_1.printNode)(node)} non-int type ${(0, astPrinter_1.printTypeNode)(lhsType)}`);
    (0, assert_1.default)(rhsType instanceof solc_typed_ast_1.IntType, `rhs of >> ${(0, astPrinter_1.printNode)(node)} non-int type ${(0, astPrinter_1.printTypeNode)(rhsType)}`);
    const lhsWidth = (0, utils_2.getIntOrFixedByteBitWidth)(lhsType);
    const signed = lhsType instanceof solc_typed_ast_1.IntType && lhsType.signed;
    const fullName = `warp_shr${signed ? '_signed' : ''}${lhsWidth}${rhsType.nBits === 256 ? '_256' : ''}`;
    const importName = [...importPaths_1.WARPLIB_MATHS, `shr${signed ? '_signed' : ''}`];
    const importedFunc = ast.registerImport(node, importName, fullName, [
        ['lhs', (0, utils_1.typeNameFromTypeNode)(lhsType, ast)],
        ['rhs', (0, utils_1.typeNameFromTypeNode)(rhsType, ast)],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.vLeftExpression.typeString}, ${node.vRightExpression.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
exports.functionaliseShr = functionaliseShr;
//# sourceMappingURL=shr.js.map