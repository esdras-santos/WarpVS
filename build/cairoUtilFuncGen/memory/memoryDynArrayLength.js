"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryDynArrayLengthGen = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const base_1 = require("../base");
const importPaths_1 = require("../../utils/importPaths");
class MemoryDynArrayLengthGen extends base_1.CairoUtilFuncGenBase {
    gen(node, ast) {
        const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference))[0];
        const arrayTypeName = (0, utils_1.typeNameFromTypeNode)(arrayType, ast);
        const funcDef = this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH, [['arrayLoc', arrayTypeName, solc_typed_ast_1.DataLocation.Memory]], [['len', (0, nodeTemplates_1.createUint256TypeName)(this.ast)]]);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [node.vExpression], this.ast);
    }
}
exports.MemoryDynArrayLengthGen = MemoryDynArrayLengthGen;
//# sourceMappingURL=memoryDynArrayLength.js.map