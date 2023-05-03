"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayFunctions = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const referenceSubPass_1 = require("./referenceSubPass");
const importPaths_1 = require("../../utils/importPaths");
/*
  Replaces array members (push, pop, length) with standalone functions that implement
  the same purpose in our models of storage and memory.
  Functions like push and pop are special cases due to not having a referenced
  FunctionDefinition and being member functions of non-contract objects, so
  it's easiest to handle them separately before dataAccessFunctionaliser
  Additionally length needs to be separated as it's handled differently to most member
  accesses (length is handled as a function that directly returns the length, whereas
  most member access become a read/write function and an offset function)
*/
class ArrayFunctions extends referenceSubPass_1.ReferenceSubPass {
    constructor() {
        super(...arguments);
        this.counter = 0;
    }
    visitFunctionCall(node, ast) {
        this.visitExpression(node, ast);
        // This pass is specifically looking for predefined solidity members
        if (node.vFunctionCallType !== solc_typed_ast_1.ExternalReferenceType.Builtin)
            return;
        const [actualLoc, expectedLoc] = this.getLocations(node);
        const utilGen = ast.getUtilFuncGen(node);
        if (node.vFunctionName === 'pop') {
            const replacement = utilGen.storage.dynArrayPop.gen(node);
            this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
        }
        else if (node.vFunctionName === 'push') {
            let replacement;
            if (node.vArguments.length > 0) {
                replacement = utilGen.storage.dynArrayPush.withArg.gen(node);
                this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
                const actualArgLoc = this.getLocations(node.vArguments[0])[0];
                if (actualArgLoc) {
                    this.expectedDataLocations.set(node.vArguments[0], actualArgLoc);
                }
            }
            else {
                const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
                replacement = utilGen.storage.dynArrayPush.withoutArg.gen(node);
                this.replace(node, replacement, node.parent, solc_typed_ast_1.DataLocation.Storage, expectedLoc, ast);
                if ((0, nodeTypeProcessing_1.isDynamicArray)(type)) {
                    const readReplacement = utilGen.storage.read.gen(replacement, (0, utils_1.typeNameFromTypeNode)(type, ast));
                    this.replace(replacement, readReplacement, node.parent, solc_typed_ast_1.DataLocation.Storage, expectedLoc, ast);
                }
            }
        }
        else if (node.vFunctionName === 'concat') {
            const replacement = utilGen.memory.concat.gen(node);
            this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
        }
    }
    visitMemberAccess(node, ast) {
        this.visitExpression(node, ast);
        if (node.memberName !== 'length')
            return;
        const expectedLoc = this.getLocations(node)[1];
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        if (baseType instanceof solc_typed_ast_1.FixedBytesType) {
            const literal = (0, nodeTemplates_1.createNumberLiteral)(baseType.size, ast, 'uint8');
            if ((0, utils_1.expressionHasSideEffects)(node.vExpression)) {
                ast.extractToConstant(node.vExpression, (0, utils_1.typeNameFromTypeNode)(baseType, ast), `__warp_tb${this.counter++}`);
            }
            this.replace(node, literal, node.parent, solc_typed_ast_1.DataLocation.Default, expectedLoc, ast);
        }
        else if (baseType instanceof solc_typed_ast_1.PointerType &&
            (baseType.to instanceof solc_typed_ast_1.ArrayType || baseType.to instanceof solc_typed_ast_1.BytesType)) {
            if ((0, nodeTypeProcessing_1.isDynamicCallDataArray)(baseType)) {
                const parent = node.parent;
                const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference))[0];
                const importedFunc = ast.registerImport(node, ...importPaths_1.FELT_TO_UINT256, [['cd_dstruct_array_len', (0, utils_1.typeNameFromTypeNode)(type, ast)]], [['len256', (0, utils_1.typeNameFromTypeNode)(type, ast)]]);
                const funcCall = (0, functionGeneration_1.createCallToFunction)(importedFunc, [node], ast);
                this.replace(node, funcCall, parent, solc_typed_ast_1.DataLocation.Default, this.expectedDataLocations.get(node), ast);
                this.expectedDataLocations.set(node, solc_typed_ast_1.DataLocation.Default);
                node.memberName = 'len';
                return;
            }
            const size = (0, nodeTypeProcessing_1.getSize)(baseType.to);
            if (size !== undefined) {
                this.replace(node, (0, nodeTemplates_1.createNumberLiteral)(size, ast, 'uint256'), undefined, solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.DataLocation.Default, ast);
            }
            else {
                const replacement = baseType.location === solc_typed_ast_1.DataLocation.Storage
                    ? ast.getUtilFuncGen(node).storage.dynArray.genLength(node, baseType.to)
                    : ast.getUtilFuncGen(node).memory.dynArrayLength.gen(node, ast);
                // The length function returns the actual length rather than a storage pointer to it,
                // so the new actual location is Default
                this.replace(node, replacement, undefined, solc_typed_ast_1.DataLocation.Default, expectedLoc, ast);
            }
        }
    }
}
exports.ArrayFunctions = ArrayFunctions;
//# sourceMappingURL=arrayFunctions.js.map