"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseFixedBytesConversion = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../../utils/astPrinter");
const functionGeneration_1 = require("../../../utils/functionGeneration");
const importPaths_1 = require("../../../utils/importPaths");
const nodeTemplates_1 = require("../../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const utils_1 = require("../../../utils/utils");
function functionaliseFixedBytesConversion(conversion, ast) {
    const arg = conversion.vArguments[0];
    const fromType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(arg, ast.inference))[0];
    (0, assert_1.default)(fromType instanceof solc_typed_ast_1.FixedBytesType, `Argument of fixed bytes conversion expected to be fixed bytes type. Got ${(0, astPrinter_1.printTypeNode)(fromType)} at ${(0, astPrinter_1.printNode)(conversion)}`);
    const toType = (0, nodeTypeProcessing_1.safeGetNodeType)(conversion, ast.inference);
    (0, assert_1.default)(toType instanceof solc_typed_ast_1.FixedBytesType, `Fixed bytes conversion expected to be fixed bytes type. Got ${(0, astPrinter_1.printTypeNode)(toType)} at ${(0, astPrinter_1.printNode)(conversion)}`);
    if (fromType.size < toType.size) {
        const fullName = `warp_bytes_widen${toType.size === 32 ? '_256' : ''}`;
        const importedFunc = ast.registerImport(conversion, importPaths_1.BYTES_CONVERSIONS, fullName, [
            ['op', (0, utils_1.typeNameFromTypeNode)(fromType, ast)],
            ['widthDiff', (0, nodeTemplates_1.createUint8TypeName)(ast)],
        ], [['res', (0, utils_1.typeNameFromTypeNode)(toType, ast)]]);
        const call = (0, functionGeneration_1.createCallToFunction)(importedFunc, [arg, (0, nodeTemplates_1.createNumberLiteral)(8 * (toType.size - fromType.size), ast, 'uint8')], ast);
        ast.replaceNode(conversion, call);
        return;
    }
    else if (fromType.size === toType.size) {
        ast.replaceNode(conversion, arg);
        return;
    }
    else {
        const fullName = `warp_bytes_narrow${fromType.size === 32 ? '_256' : ''}`;
        const importedFunc = ast.registerImport(conversion, importPaths_1.BYTES_CONVERSIONS, fullName, [
            ['op', (0, utils_1.typeNameFromTypeNode)(fromType, ast)],
            ['widthDiff', (0, nodeTemplates_1.createUint8TypeName)(ast)],
        ], [['res', (0, utils_1.typeNameFromTypeNode)(toType, ast)]]);
        const call = (0, functionGeneration_1.createCallToFunction)(importedFunc, [arg, (0, nodeTemplates_1.createNumberLiteral)(8 * (fromType.size - toType.size), ast, 'uint8')], ast);
        ast.replaceNode(conversion, call);
        return;
    }
}
exports.functionaliseFixedBytesConversion = functionaliseFixedBytesConversion;
//# sourceMappingURL=fixedBytes.js.map