"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAllocations = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const referenceSubPass_1 = require("./referenceSubPass");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
/*
  Handles expressions that directly insert data into memory: struct constructors, news, and inline arrays
  Requires expected data location analysis to determine whether to insert objects into memory
  For memory objects, functions are generated that return a felt associated with the start of the data
*/
class MemoryAllocations extends referenceSubPass_1.ReferenceSubPass {
    visitFunctionCall(node, ast) {
        this.visitExpression(node, ast);
        const [actualLoc, expectedLoc] = this.getLocations(node);
        if (node.kind === solc_typed_ast_1.FunctionCallKind.StructConstructorCall &&
            this.expectedDataLocations.get(node) === solc_typed_ast_1.DataLocation.Memory) {
            const replacement = ast.getUtilFuncGen(node).memory.struct.gen(node);
            this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
        }
        else if (node.vExpression instanceof solc_typed_ast_1.NewExpression) {
            if (actualLoc === solc_typed_ast_1.DataLocation.Memory) {
                this.allocateMemoryDynArray(node, ast);
            }
            else {
                throw new errors_1.NotSupportedYetError(`Allocating dynamic ${actualLoc ?? 'unknown-location'} arrays not implemented yet (${(0, astPrinter_1.printNode)(node)})`);
            }
        }
        else if (node.kind === solc_typed_ast_1.FunctionCallKind.TypeConversion) {
            const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference))[0];
            const arg = node.vArguments[0];
            if ((type instanceof solc_typed_ast_1.BytesType || type instanceof solc_typed_ast_1.StringType) && arg instanceof solc_typed_ast_1.Literal) {
                const replacement = ast.getUtilFuncGen(node).memory.arrayLiteral.stringGen(arg);
                this.replace(node, replacement, node.parent, actualLoc, expectedLoc, ast);
            }
        }
    }
    visitTupleExpression(node, ast) {
        this.visitExpression(node, ast);
        const [actualLoc, expectedLoc] = this.getLocations(node);
        if (!node.isInlineArray)
            return;
        const replacement = ast.getUtilFuncGen(node).memory.arrayLiteral.tupleGen(node);
        this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
    }
    allocateMemoryDynArray(node, ast) {
        (0, assert_1.default)(node.vExpression instanceof solc_typed_ast_1.NewExpression);
        (0, assert_1.default)(node.vArguments.length === 1, `Expected new expression ${(0, astPrinter_1.printNode)(node)} to have one argument, has ${node.vArguments.length}`);
        const funcImport = ast.registerImport(node, ...importPaths_1.WM_NEW, [
            ['len', (0, nodeTemplates_1.createUint256TypeName)(ast)],
            ['elemWidth', (0, nodeTemplates_1.createUint256TypeName)(ast)],
        ], [['loc', node.vExpression.vTypeName, solc_typed_ast_1.DataLocation.Memory]]);
        const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference))[0];
        (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.ArrayType ||
            arrayType instanceof solc_typed_ast_1.BytesType ||
            arrayType instanceof solc_typed_ast_1.StringType);
        const elementCairoType = cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.getElementType)(arrayType), ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        const call = (0, functionGeneration_1.createCallToFunction)(funcImport, [node.vArguments[0], (0, nodeTemplates_1.createNumberLiteral)(elementCairoType.width, ast, 'uint256')], ast);
        const [actualLoc, expectedLoc] = this.getLocations(node);
        this.replace(node, call, undefined, actualLoc, expectedLoc, ast);
    }
}
exports.MemoryAllocations = MemoryAllocations;
//# sourceMappingURL=memoryAllocations.js.map