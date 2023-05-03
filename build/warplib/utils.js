"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntOrFixedByteBitWidth = exports.IntFunction = exports.Comparison = exports.IntxIntFunction = exports.generateFile = exports.msbAndNext = exports.msb = exports.mask = exports.bound = exports.uint256 = exports.pow2 = exports.forAllWidths = exports.PATH_TO_WARPLIB = void 0;
const assert_1 = __importDefault(require("assert"));
const fs = __importStar(require("fs"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../utils/astPrinter");
const utils_1 = require("../utils/utils");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const path_1 = __importDefault(require("path"));
const importPaths_1 = require("../utils/importPaths");
exports.PATH_TO_WARPLIB = path_1.default.join('.', 'warplib', 'src');
function forAllWidths(funcGen) {
    return (0, utils_1.mapRange)(32, (n) => 8 * (n + 1)).map(funcGen);
}
exports.forAllWidths = forAllWidths;
function pow2(n) {
    return 2n ** BigInt(n);
}
exports.pow2 = pow2;
function uint256(n) {
    if (typeof n === 'number') {
        n = BigInt(n);
    }
    const low = n % 2n ** 128n;
    const high = (n - low) / 2n ** 128n;
    return `Uint256(0x${low.toString(16)}, 0x${high.toString(16)})`;
}
exports.uint256 = uint256;
function bound(width) {
    return `0x${pow2(width).toString(16)}`;
}
exports.bound = bound;
function mask(width) {
    return `0x${(pow2(width) - 1n).toString(16)}`;
}
exports.mask = mask;
function msb(width) {
    return `0x${pow2(width - 1).toString(16)}`;
}
exports.msb = msb;
function msbAndNext(width) {
    return `0x${(pow2(width) + pow2(width - 1)).toString(16)}`;
}
exports.msbAndNext = msbAndNext;
// This is used along with the commented out code in generateFile to enable cairo-formatting
// const warpVenvPrefix = `PATH=${path.resolve(__dirname, '..', '..', 'warp_venv', 'bin')}:$PATH`;
function generateFile(warpFunc) {
    const pathToFile = path_1.default.join(exports.PATH_TO_WARPLIB, 'maths', `${warpFunc.fileName}.cairo`);
    fs.writeFileSync(pathToFile, `//AUTO-GENERATED\n${warpFunc.imports.join('\n')}\n\n${warpFunc.functions.join('\n')}\n`);
    // Disable cairo-formatting for now, as it has a bug that breaks the generated code
    // execSync(`${warpVenvPrefix} cairo-format -i ./warplib/maths/${name}.cairo`);
}
exports.generateFile = generateFile;
function IntxIntFunction(node, name, appendWidth, separateSigned, unsafe, ast) {
    const lhsType = (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference), ast);
    const rhsType = (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference), ast);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(retType instanceof solc_typed_ast_1.IntType || retType instanceof solc_typed_ast_1.FixedBytesType, `${(0, astPrinter_1.printNode)(node)} has type ${(0, astPrinter_1.printTypeNode)(retType)}, which is not compatible with ${name}`);
    const width = getIntOrFixedByteBitWidth(retType);
    const signed = retType instanceof solc_typed_ast_1.IntType && retType.signed;
    const shouldAppendWidth = appendWidth === 'always' || (appendWidth === 'signedOrWide' && signed) || width === 256;
    const fullName = [
        'warp_',
        name,
        signed && separateSigned ? '_signed' : '',
        unsafe ? '_unsafe' : '',
        shouldAppendWidth ? `${width}` : '',
    ].join('');
    const importName = [
        ...importPaths_1.WARPLIB_MATHS,
        `${name}${signed && separateSigned ? '_signed' : ''}${unsafe ? '_unsafe' : ''}`,
    ];
    const importedFunc = ast.registerImport(node, importName, fullName, [
        ['lhs', lhsType],
        ['rhs', rhsType],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.typeString}, ${node.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
exports.IntxIntFunction = IntxIntFunction;
function Comparison(node, name, appendWidth, separateSigned, ast) {
    const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
    const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    const wide = (lhsType instanceof solc_typed_ast_1.IntType || lhsType instanceof solc_typed_ast_1.FixedBytesType) &&
        getIntOrFixedByteBitWidth(lhsType) === 256;
    const signed = lhsType instanceof solc_typed_ast_1.IntType && lhsType.signed;
    const shouldAppendWidth = wide || (appendWidth === 'signedOrWide' && signed);
    const fullName = [
        'warp_',
        name,
        separateSigned && signed ? '_signed' : '',
        shouldAppendWidth ? `${getIntOrFixedByteBitWidth(lhsType)}` : '',
    ].join('');
    const importName = [...importPaths_1.WARPLIB_MATHS, `${name}${signed && separateSigned ? '_signed' : ''}`];
    const importedFunc = ast.registerImport(node, importName, fullName, [
        ['lhs', (0, utils_1.typeNameFromTypeNode)(lhsType, ast)],
        ['rhs', (0, utils_1.typeNameFromTypeNode)(rhsType, ast)],
    ], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${node.vLeftExpression.typeString}, ${node.vRightExpression.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [node.vLeftExpression, node.vRightExpression]);
    ast.replaceNode(node, call);
}
exports.Comparison = Comparison;
function IntFunction(node, argument, name, fileName, ast) {
    const opType = (0, nodeTypeProcessing_1.safeGetNodeType)(argument, ast.inference);
    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
    (0, assert_1.default)(retType instanceof solc_typed_ast_1.IntType || retType instanceof solc_typed_ast_1.FixedBytesType, `Expected IntType or FixedBytes for ${name}, got ${(0, astPrinter_1.printTypeNode)(retType)}`);
    const width = getIntOrFixedByteBitWidth(retType);
    const fullName = `warp_${name}${width}`;
    const importedFunc = ast.registerImport(node, [...importPaths_1.WARPLIB_MATHS, fileName], fullName, [['op', (0, utils_1.typeNameFromTypeNode)(opType, ast)]], [['res', (0, utils_1.typeNameFromTypeNode)(retType, ast)]]);
    const call = new solc_typed_ast_1.FunctionCall(ast.reserveId(), node.src, node.typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, new solc_typed_ast_1.Identifier(ast.reserveId(), '', `function (${argument.typeString}) returns (${node.typeString})`, fullName, importedFunc.id), [argument]);
    ast.replaceNode(node, call);
}
exports.IntFunction = IntFunction;
function getIntOrFixedByteBitWidth(type) {
    if (type instanceof solc_typed_ast_1.IntType) {
        return type.nBits;
    }
    else if (type instanceof solc_typed_ast_1.FixedBytesType) {
        return type.size * 8;
    }
    else {
        (0, assert_1.default)(false, `Attempted to get width for non-int, non-fixed bytes type ${(0, astPrinter_1.printTypeNode)(type)}`);
    }
}
exports.getIntOrFixedByteBitWidth = getIntOrFixedByteBitWidth;
//# sourceMappingURL=utils.js.map