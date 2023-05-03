"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseExp = exports.exp_signed_unsafe = exports.exp_unsafe = exports.exp_signed = exports.exp = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const importPaths_1 = require("../../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const utils_1 = require("../../../utils/utils");
const utils_2 = require("../../utils");
function exp() {
    return createExp(false, false);
}
exports.exp = exp;
function exp_signed() {
    return createExp(true, false);
}
exports.exp_signed = exp_signed;
function exp_unsafe() {
    return createExp(false, true);
}
exports.exp_unsafe = exp_unsafe;
function exp_signed_unsafe() {
    return createExp(true, true);
}
exports.exp_signed_unsafe = exp_signed_unsafe;
function createExp(signed, unsafe) {
    const suffix = `${signed ? '_signed' : ''}${unsafe ? '_unsafe' : ''}`;
    return {
        fileName: `exp${suffix}`,
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.uint256 import Uint256, uint256_sub',
            `from warplib.maths.mul${suffix} import ${(0, utils_1.mapRange)(32, (n) => `warp_mul${suffix}${8 * n + 8}`).join(', ')}`,
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    `func _repeated_multiplication${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(op : Uint256, count : felt) -> (res : Uint256){`,
                    `    if (count == 0){`,
                    `        return (Uint256(1, 0),);`,
                    `    }`,
                    `    let (x) = _repeated_multiplication${width}(op, count - 1);`,
                    `    let (res) = warp_mul${suffix}${width}(op, x);`,
                    `    return (res,);`,
                    `}`,
                    `func warp_exp${suffix}${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : felt) -> (res : Uint256){`,
                    `    if (rhs == 0){`,
                    `        return (Uint256(1, 0),);`,
                    '    }',
                    '    if (lhs.high == 0){',
                    `        if (lhs.low * (lhs.low - 1) == 0){`,
                    '            return (lhs,);',
                    `        }`,
                    `    }`,
                    ...getNegativeOneShortcutCode(signed, width, false),
                    `    let (res) = _repeated_multiplication${width}(lhs, rhs);`,
                    `    return (res,);`,
                    `}`,
                    `func _repeated_multiplication_256_${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(op : Uint256, count : Uint256) -> (res : Uint256){`,
                    `    if (count.low == 0 and count.high == 0){`,
                    `        return (Uint256(1, 0),);`,
                    `    }`,
                    `    let (decr) = uint256_sub(count, Uint256(1, 0));`,
                    `    let (x) = _repeated_multiplication_256_${width}(op, decr);`,
                    `    let (res) = warp_mul${suffix}${width}(op, x);`,
                    `    return (res,);`,
                    `}`,
                    `func warp_exp_wide${suffix}${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : Uint256, rhs : Uint256) -> (res : Uint256){`,
                    `    if (rhs.high == 0 and rhs.low == 0){`,
                    `        return (Uint256(1, 0),);`,
                    '    }',
                    '    if (lhs.high == 0 and lhs.low * (lhs.low - 1) == 0){',
                    '        return (lhs,);',
                    `    }`,
                    ...getNegativeOneShortcutCode(signed, width, true),
                    `    let (res) = _repeated_multiplication_256_${width}(lhs, rhs);`,
                    `    return (res,);`,
                    `}`,
                ].join('\n');
            }
            else {
                return [
                    `func _repeated_multiplication${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(op : felt, count : felt) -> (res : felt){`,
                    `    alloc_locals;`,
                    `    if (count == 0){`,
                    `        return (1,);`,
                    `    }else{`,
                    `        let (x) = _repeated_multiplication${width}(op, count - 1);`,
                    `        local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr;`,
                    `        let (res) = warp_mul${suffix}${width}(op, x);`,
                    `        return (res,);`,
                    `    }`,
                    `}`,
                    `func warp_exp${suffix}${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : felt, rhs : felt) -> (res : felt){`,
                    '    if (rhs == 0){',
                    '        return (1,);',
                    `    }`,
                    '    if (lhs * (lhs-1) * (rhs-1) == 0){',
                    '        return (lhs,);',
                    '    }',
                    ...getNegativeOneShortcutCode(signed, width, false),
                    `    let (res) = _repeated_multiplication${width}(lhs, rhs);`,
                    `    return (res,);`,
                    '}',
                    `func _repeated_multiplication_256_${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(op : felt, count : Uint256) -> (res : felt){`,
                    `    alloc_locals;`,
                    `    if (count.low == 0 and count.high == 0){`,
                    `        return (1,);`,
                    `    }`,
                    `    let (decr) = uint256_sub(count, Uint256(1, 0));`,
                    `    let (x) = _repeated_multiplication_256_${width}(op, decr);`,
                    `    local bitwise_ptr : BitwiseBuiltin* = bitwise_ptr;`,
                    `    let (res) = warp_mul${suffix}${width}(op, x);`,
                    `    return (res,);`,
                    `}`,
                    `func warp_exp_wide${suffix}${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(lhs : felt, rhs : Uint256) -> (res : felt){`,
                    '    if (rhs.low == 0){',
                    '        if (rhs.high == 0){',
                    '            return (1,);',
                    '        }',
                    `    }`,
                    '    if (lhs * (lhs-1) == 0){',
                    '        return (lhs,);',
                    '    }',
                    '    if (rhs.low == 1 and rhs.high == 0){',
                    '        return (lhs,);',
                    '    }',
                    ...getNegativeOneShortcutCode(signed, width, true),
                    `    let (res) = _repeated_multiplication_256_${width}(lhs, rhs);`,
                    `    return (res,);`,
                    '}',
                ].join('\n');
            }
        }),
    };
}
function getNegativeOneShortcutCode(signed, lhsWidth, rhsWide) {
    if (!signed)
        return [];
    if (lhsWidth < 256) {
        return [
            `if ((lhs - ${(0, utils_2.mask)(lhsWidth)}) == 0){`,
            `    let (is_odd) = bitwise_and(${rhsWide ? 'rhs.low' : 'rhs'}, 1);`,
            `    return (1 + is_odd * 0x${'f'.repeat(lhsWidth / 8 - 1)}e,);`,
            `}`,
        ];
    }
    else {
        return [
            `if ((lhs.low - ${(0, utils_2.mask)(128)}) == 0 and (lhs.high - ${(0, utils_2.mask)(128)}) == 0){`,
            `    let (is_odd) = bitwise_and(${rhsWide ? 'rhs.low' : 'rhs'}, 1);`,
            `    return (Uint256(1 + is_odd * 0x${'f'.repeat(31)}e, is_odd * ${(0, utils_2.mask)(128)}),);`,
            `}`,
        ];
    }
}
function functionaliseExp(node, unsafe, ast) {
    const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
    const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(retType instanceof solc_typed_ast_1.IntType, `${(0, astPrinter_1.printNode)(node)} has type ${(0, astPrinter_1.printTypeNode)(retType)}, which is not compatible with **`);
    (0, assert_1.default)(rhsType instanceof solc_typed_ast_1.IntType, `${(0, astPrinter_1.printNode)(node)} has rhs-type ${rhsType.pp()}, which is not compatible with **`);
    const fullName = [
        'warp_',
        'exp',
        rhsType.nBits === 256 ? '_wide' : '',
        retType.signed ? '_signed' : '',
        unsafe ? '_unsafe' : '',
        `${(0, utils_2.getIntOrFixedByteBitWidth)(retType)}`,
    ].join('');
    const importName = [
        ...importPaths_1.WARPLIB_MATHS,
        `exp${retType.signed ? '_signed' : ''}${unsafe ? '_unsafe' : ''}`,
    ];
    const importedFunc = ast.registerImport(node, importName, fullName, [
        ['lhs', (0, utils_1.typeNameFromTypeNode)(lhsType, ast)],
        ['rhs', (0, utils_1.typeNameFromTypeNode)(rhsType, ast)],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.typeString}, ${node.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
exports.functionaliseExp = functionaliseExp;
//# sourceMappingURL=exp.js.map