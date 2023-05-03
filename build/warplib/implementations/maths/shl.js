"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseShl = exports.shl = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const importPaths_1 = require("../../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const utils_1 = require("../../../utils/utils");
const utils_2 = require("../../utils");
// rhs is always unsigned, and signed and unsigned shl are the same
function shl() {
    //Need to provide an implementation with 256bit rhs and <256bit lhs
    return {
        fileName: 'shl',
        imports: [
            'from starkware.cairo.common.bitwise import bitwise_and',
            'from starkware.cairo.common.cairo_builtins import BitwiseBuiltin',
            'from starkware.cairo.common.math import split_felt',
            'from starkware.cairo.common.math_cmp import is_le_felt',
            'from starkware.cairo.common.uint256 import Uint256, uint256_shl',
            'from warplib.maths.pow2 import pow2',
        ],
        functions: (0, utils_2.forAllWidths)((width) => {
            if (width === 256) {
                return [
                    'func warp_shl256{range_check_ptr}(lhs : Uint256, rhs : felt) -> (result : Uint256){',
                    '    let (high, low) = split_felt(rhs);',
                    '    let (res) = uint256_shl(lhs, Uint256(low, high));',
                    '    return (res,);',
                    '}',
                    'func warp_shl256_256{range_check_ptr}(lhs : Uint256, rhs : Uint256) -> (result : Uint256){',
                    '    let (res) = uint256_shl(lhs, rhs);',
                    '    return (res,);',
                    '}',
                ].join('\n');
            }
            else {
                return [
                    `func warp_shl${width}{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : felt) -> (res : felt){`,
                    `    // width <= rhs (shift amount) means result will be 0`,
                    `    let large_shift = is_le_felt(${width}, rhs);`,
                    `    if (large_shift == 1){`,
                    `        return (0,);`,
                    `    }else{`,
                    `        let preserved_width = ${width} - rhs;`,
                    `        let (preserved_bound) = pow2(preserved_width);`,
                    `        let (lhs_truncated) = bitwise_and(lhs, preserved_bound - 1);`,
                    `        let (multiplier) = pow2(rhs);`,
                    `        return (lhs_truncated * multiplier,);`,
                    `    }`,
                    `}`,
                    `func warp_shl${width}_256{range_check_ptr, bitwise_ptr : BitwiseBuiltin*}(`,
                    `        lhs : felt, rhs : Uint256) -> (res : felt){`,
                    `    if (rhs.high == 0){`,
                    `        let (res) = warp_shl${width}(lhs, rhs.low);`,
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
exports.shl = shl;
function functionaliseShl(node, ast) {
    const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
    const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(lhsType instanceof solc_typed_ast_1.IntType || lhsType instanceof solc_typed_ast_1.FixedBytesType, `lhs of << ${(0, astPrinter_1.printNode)(node)} non-int type ${(0, astPrinter_1.printTypeNode)(lhsType)}`);
    (0, assert_1.default)(rhsType instanceof solc_typed_ast_1.IntType, `rhs of << ${(0, astPrinter_1.printNode)(node)} non-int type ${(0, astPrinter_1.printTypeNode)(rhsType)}`);
    const lhsWidth = (0, utils_2.getIntOrFixedByteBitWidth)(lhsType);
    const fullName = `warp_shl${lhsWidth}${rhsType.nBits === 256 ? '_256' : ''}`;
    const importedFunc = ast.registerImport(node, [...importPaths_1.WARPLIB_MATHS, 'shl'], fullName, [
        ['lhs', (0, utils_1.typeNameFromTypeNode)(lhsType, ast)],
        ['rhs', (0, utils_1.typeNameFromTypeNode)(rhsType, ast)],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.vLeftExpression.typeString}, ${node.vRightExpression.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
exports.functionaliseShl = functionaliseShl;
//# sourceMappingURL=shl.js.map