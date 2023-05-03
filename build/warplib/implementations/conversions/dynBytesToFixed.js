"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionaliseBytesToFixedBytes = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const functionGeneration_1 = require("../../../utils/functionGeneration");
const importPaths_1 = require("../../../utils/importPaths");
const nodeTemplates_1 = require("../../../utils/nodeTemplates");
const utils_1 = require("../../../utils/utils");
function functionaliseBytesToFixedBytes(node, targetType, ast) {
    const wide = targetType.size === 32;
    const funcName = wide ? 'wm_bytes_to_fixed32' : 'wm_bytes_to_fixed';
    const args = wide
        ? [['bytesLoc', (0, nodeTemplates_1.createBytesTypeName)(ast), solc_typed_ast_1.DataLocation.Memory]]
        : [
            ['bytesLoc', (0, nodeTemplates_1.createBytesTypeName)(ast), solc_typed_ast_1.DataLocation.Memory],
            ['width', (0, nodeTemplates_1.createUint8TypeName)(ast)],
        ];
    const importedFunc = ast.registerImport(node, importPaths_1.WARPLIB_MEMORY, funcName, args, [
        ['res', (0, utils_1.typeNameFromTypeNode)(targetType, ast)],
    ]);
    const replacement = (0, functionGeneration_1.createCallToFunction)(importedFunc, wide
        ? node.vArguments
        : [...node.vArguments, (0, nodeTemplates_1.createNumberLiteral)(targetType.size, ast, 'uint8')], ast);
    ast.replaceNode(node, replacement);
}
exports.functionaliseBytesToFixedBytes = functionaliseBytesToFixedBytes;
//# sourceMappingURL=dynBytesToFixed.js.map