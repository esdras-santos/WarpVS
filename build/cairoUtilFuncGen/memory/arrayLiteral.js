"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryArrayLiteralGen = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const typeConstructs_1 = require("../../utils/typeConstructs");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
const endent_1 = __importDefault(require("endent"));
/*
  Converts [a,b,c] and "abc" into WM0_arr(a,b,c), which allocates new space in warp_memory
  and assigns the given values into that space, returning the location of the
  start of the array
*/
class MemoryArrayLiteralGen extends base_1.StringIndexedFuncGen {
    stringGen(node) {
        // Encode the literal to the uint-8 byte representation
        assert(node.kind === solc_typed_ast_1.LiteralKind.String ||
            node.kind === solc_typed_ast_1.LiteralKind.UnicodeString ||
            solc_typed_ast_1.LiteralKind.HexString);
        const size = node.hexValue.length / 2;
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(type, size);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, (0, utils_1.mapRange)(size, (n) => (0, nodeTemplates_1.createNumberLiteral)(parseInt(node.hexValue.slice(2 * n, 2 * n + 2), 16), this.ast)), this.ast);
    }
    tupleGen(node) {
        const elements = node.vOriginalComponents.filter(typeConstructs_1.notNull);
        assert(elements.length === node.vOriginalComponents.length);
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference))[0];
        assert(type instanceof solc_typed_ast_1.ArrayType ||
            type instanceof solc_typed_ast_1.TupleType ||
            type instanceof solc_typed_ast_1.BytesType ||
            type instanceof solc_typed_ast_1.StringType);
        const wideSize = (0, nodeTypeProcessing_1.getSize)(type);
        const size = wideSize !== undefined
            ? (0, utils_1.narrowBigIntSafe)(wideSize, `${(0, astPrinter_1.printNode)(node)} too long to process`)
            : elements.length;
        const funcDef = this.getOrCreateFuncDef(type, size);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, elements, this.ast);
    }
    getOrCreateFuncDef(type, size) {
        const baseType = (0, nodeTypeProcessing_1.getElementType)(type);
        const key = baseType.pp() + size;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const baseTypeName = (0, utils_1.typeNameFromTypeNode)(baseType, this.ast);
        const funcInfo = this.getOrCreate(baseType, size, (0, nodeTypeProcessing_1.isDynamicArray)(type) || type instanceof solc_typed_ast_1.StringLiteralType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, (0, utils_1.mapRange)(size, (n) => [
            `arg_${n}`,
            (0, cloning_1.cloneASTNode)(baseTypeName, this.ast),
            (0, base_1.locationIfComplexType)(baseType, solc_typed_ast_1.DataLocation.Memory),
        ]), [['arr', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type, size, dynamic) {
        const elementCairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast);
        const funcName = `wm${this.generatedFunctionsDef.size}_${dynamic ? 'dynamic' : 'static'}_array`;
        const argString = (0, utils_1.mapRange)(size, (n) => `e${n}: ${elementCairoType.toString()}`).join(', ');
        // If it's dynamic we need to include the length at the start
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const alloc_len = dynamic ? size * elementCairoType.width + 2 : size * elementCairoType.width;
        const writes = [
            ...(dynamic ? [`wm_write_256{warp_memory=warp_memory}(start, ${(0, utils_2.uint256)(size)});`] : []),
            ...(0, utils_1.mapRange)(size, (n) => elementCairoType.serialiseMembers(`e${n}`))
                .flat()
                .map((name, index) => `warp_memory.insert(
            ${(0, base_1.add)('start', dynamic ? index + 2 : index)},
            ${name}
          );`),
        ];
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        fn ${funcName}(${argString}) -> felt252 {
          let start = warp_memory.pointer;
          ${writes.join('\n')}
          return start;
        }`,
            functionsCalled: [
                this.requireImport(...importPaths_1.ARRAY),
                this.requireImport(...importPaths_1.ARRAY_TRAIT),
                this.requireImport(...importPaths_1.U32_TO_FELT),
                this.requireImport(...importPaths_1.WARP_MEMORY),
                this.requireImport(...importPaths_1.MEMORY_TRAIT),
            ],
        };
    }
}
exports.MemoryArrayLiteralGen = MemoryArrayLiteralGen;
//# sourceMappingURL=arrayLiteral.js.map