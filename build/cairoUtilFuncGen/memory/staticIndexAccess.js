"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStaticArrayIndexAccessGen = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
/*
  Produces function stubs for index accesses into statically sized memory arrays
  The actual implementation of this is written in warplib, but for consistency with other
  such cases, this is implemented as a CairoUtilFuncGenBase that produces no code
  The associated warplib function takes the width of the datatype and the length of the array
  as parameters to avoid bloating the code with separate functions for each case
*/
class MemoryStaticArrayIndexAccessGen extends base_1.CairoUtilFuncGenBase {
    gen(indexAccess, arrayType) {
        assert(arrayType.size !== undefined, `Attempted to use static indexing for dynamic index ${(0, astPrinter_1.printNode)(indexAccess)}`);
        assert(indexAccess.vIndexExpression, `Found index access without index expression at ${(0, astPrinter_1.printNode)(indexAccess)}`);
        const importFunc = this.requireImport(...importPaths_1.WM_INDEX_STATIC, [
            ['arr', (0, utils_1.typeNameFromTypeNode)(arrayType, this.ast), solc_typed_ast_1.DataLocation.Memory],
            ['index', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
            ['width', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
            ['length', (0, nodeTemplates_1.createUint256TypeName)(this.ast)],
        ], [['child', (0, utils_1.typeNameFromTypeNode)(arrayType.elementT, this.ast), solc_typed_ast_1.DataLocation.Memory]]);
        const width = cairoTypeSystem_1.CairoType.fromSol(arrayType.elementT, this.ast).width;
        return (0, functionGeneration_1.createCallToFunction)(importFunc, [
            indexAccess.vBaseExpression,
            indexAccess.vIndexExpression,
            (0, nodeTemplates_1.createNumberLiteral)(width, this.ast, 'uint256'),
            (0, nodeTemplates_1.createNumberLiteral)(arrayType.size, this.ast, 'uint256'),
        ], this.ast);
    }
}
exports.MemoryStaticArrayIndexAccessGen = MemoryStaticArrayIndexAccessGen;
//# sourceMappingURL=staticIndexAccess.js.map