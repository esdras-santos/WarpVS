"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataAccessFunctionaliser = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../../utils/errors");
const astPrinter_1 = require("../../utils/astPrinter");
const utils_1 = require("../../utils/utils");
const formatting_1 = require("../../utils/formatting");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const cloning_1 = require("../../utils/cloning");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const referenceSubPass_1 = require("./referenceSubPass");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
/*
  Uses the analyses of ActualLocationAnalyser and ExpectedLocationAnalyser to
  replace all references to memory and storage with the appropriate functions
  acting on warp_memory and WARP_STORAGE respectively.

  For example:
  Actual - storage, expected - default, this is a read of a storage variable, and
  so the appropriate cairoUtilFuncGen is invoked to replace the expression with a
  read function

  Most cases are handled by visitExpression, with special cases handled by the more
  specific visit methods. E.g. visitAssignment creating write functions, or visitIdentifier
  having its own rules because 'x = y' changes what x points to, whereas 'x.a = y' writes to
  where x.a points to
*/
class DataAccessFunctionaliser extends referenceSubPass_1.ReferenceSubPass {
    visitExpression(node, ast) {
        // First, collect data before any processing
        const originalNode = node;
        const [actualLoc, expectedLoc] = this.getLocations(node);
        if (expectedLoc === undefined) {
            return this.commonVisit(node, ast);
        }
        const utilFuncGen = ast.getUtilFuncGen(node);
        const parent = node.parent;
        // Finally if a copy from actual to expected location is required, insert this last
        let copyFunc = null;
        if (actualLoc !== expectedLoc) {
            if (actualLoc === solc_typed_ast_1.DataLocation.Storage) {
                switch (expectedLoc) {
                    case solc_typed_ast_1.DataLocation.Default: {
                        copyFunc = utilFuncGen.storage.read.gen(node);
                        break;
                    }
                    case solc_typed_ast_1.DataLocation.Memory: {
                        copyFunc = utilFuncGen.storage.toMemory.gen(node);
                        break;
                    }
                    case solc_typed_ast_1.DataLocation.CallData: {
                        copyFunc = ast.getUtilFuncGen(node).storage.toCallData.gen(node);
                        break;
                    }
                }
            }
            else if (actualLoc === solc_typed_ast_1.DataLocation.Memory) {
                switch (expectedLoc) {
                    case solc_typed_ast_1.DataLocation.Default: {
                        copyFunc = utilFuncGen.memory.read.gen(node);
                        break;
                    }
                    case solc_typed_ast_1.DataLocation.Storage: {
                        // Such conversions should be handled in specific visit functions, as the storage location must be known
                        throw new errors_1.TranspileFailedError(`Unhandled memory -> storage conversion ${(0, astPrinter_1.printNode)(node)}`);
                    }
                    case solc_typed_ast_1.DataLocation.CallData: {
                        copyFunc = utilFuncGen.memory.toCallData.gen(node);
                        break;
                    }
                }
            }
            else if (actualLoc === solc_typed_ast_1.DataLocation.CallData) {
                switch (expectedLoc) {
                    case solc_typed_ast_1.DataLocation.Default:
                        // Nothing to do here
                        break;
                    case solc_typed_ast_1.DataLocation.Memory:
                        copyFunc = ast.getUtilFuncGen(node).calldata.toMemory.gen(node);
                        break;
                    case solc_typed_ast_1.DataLocation.Storage:
                        // Such conversions should be handled in specific visit functions, as the storage location must be known
                        throw new errors_1.TranspileFailedError(`Unhandled calldata -> storage conversion ${(0, astPrinter_1.printNode)(node)}`);
                }
            }
        }
        // Update the expected location of the node to be equal to its
        // actual location, now that any discrepancy has been handled
        if (copyFunc) {
            this.replace(node, copyFunc, parent, expectedLoc, expectedLoc, ast);
        }
        if (actualLoc === undefined) {
            this.expectedDataLocations.delete(node);
        }
        else {
            this.expectedDataLocations.set(node, actualLoc);
        }
        // Now that node has been inserted into the appropriate functions, read its children
        this.commonVisit(originalNode, ast);
    }
    visitAssignment(node, ast) {
        if (shouldLeaveAsCairoAssignment(node.vLeftHandSide)) {
            return this.visitExpression(node, ast);
        }
        const [actualLoc, expectedLoc] = this.getLocations(node);
        const fromLoc = this.getLocations(node.vRightHandSide)[1];
        const toLoc = this.getLocations(node.vLeftHandSide)[1];
        let funcGen = null;
        if (toLoc === solc_typed_ast_1.DataLocation.Memory) {
            funcGen = ast.getUtilFuncGen(node).memory.write;
        }
        else if (toLoc === solc_typed_ast_1.DataLocation.Storage) {
            if (fromLoc === solc_typed_ast_1.DataLocation.Storage) {
                funcGen = ast.getUtilFuncGen(node).storage.toStorage;
            }
            else if (fromLoc === solc_typed_ast_1.DataLocation.Memory) {
                const [convert, result] = ast
                    .getUtilFuncGen(node)
                    .memory.convert.genIfNecessary(node.vLeftHandSide, (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightHandSide, ast.inference));
                if (result) {
                    ast.replaceNode(node.vRightHandSide, convert, node);
                }
                funcGen = ast.getUtilFuncGen(node).memory.toStorage;
            }
            else if (fromLoc === solc_typed_ast_1.DataLocation.CallData) {
                const [convertExpression, result] = ast
                    .getUtilFuncGen(node)
                    .calldata.convert.genIfNecessary(node.vLeftHandSide, node.vRightHandSide);
                if (result) {
                    const parent = node.parent;
                    (0, assert_1.default)(parent !== undefined);
                    ast.replaceNode(node, convertExpression, parent);
                }
                else {
                    funcGen = ast.getUtilFuncGen(node).calldata.toStorage;
                }
            }
            else {
                funcGen = ast.getUtilFuncGen(node).storage.write;
            }
        }
        if (funcGen) {
            const replacementFunc = funcGen.gen(node.vLeftHandSide, node.vRightHandSide);
            this.replace(node, replacementFunc, undefined, actualLoc, expectedLoc, ast);
            return this.dispatchVisit(replacementFunc, ast);
        }
        this.visitExpression(node, ast);
    }
    visitIdentifier(node, ast) {
        const [actualLoc, expectedLoc] = this.getLocations(node);
        // Only replace the identifier with a read function if we need to extract the data
        if (expectedLoc === undefined || expectedLoc === actualLoc) {
            this.visitExpression(node, ast);
            return;
        }
        const decl = node.vReferencedDeclaration;
        if (decl === undefined || !(decl instanceof solc_typed_ast_1.VariableDeclaration)) {
            throw new errors_1.WillNotSupportError(`Writing to Non-variable ${actualLoc} identifier ${(0, astPrinter_1.printNode)(node)} not supported`);
        }
        (0, assert_1.default)(decl.vType !== undefined, (0, formatting_1.error)('VariableDeclaration.vType should be defined for compiler versions > 0.4.x'));
        if (actualLoc === solc_typed_ast_1.DataLocation.Storage && (0, utils_1.isCairoConstant)(decl)) {
            return;
        }
        this.visitExpression(node, ast);
    }
    visitFunctionCall(node, ast) {
        if (node.kind === solc_typed_ast_1.FunctionCallKind.StructConstructorCall) {
            // Memory struct constructor calls should have been replaced by memoryAllocations
            return this.commonVisit(node, ast);
        }
        else {
            return this.visitExpression(node, ast);
        }
    }
    visitMemberAccess(node, ast) {
        const [actualLoc, expectedLoc] = this.getLocations(node);
        if (actualLoc !== solc_typed_ast_1.DataLocation.Storage && actualLoc !== solc_typed_ast_1.DataLocation.Memory) {
            return this.visitExpression(node, ast);
        }
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        if (!(type instanceof solc_typed_ast_1.PointerType)) {
            (0, assert_1.default)((type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.ContractDefinition) ||
                type instanceof solc_typed_ast_1.FixedBytesType, `Unexpected unhandled non-pointer non-contract member access. Found at ${(0, astPrinter_1.printNode)(node)}: '${node.memberName}' with type ${(0, astPrinter_1.printTypeNode)(type)}`);
            return this.visitExpression(node, ast);
        }
        const utilFuncGen = ast.getUtilFuncGen(node);
        // To transform a struct member access to cairo, there are two steps
        // First get the location in storage of the specific struct member
        // Then use a standard storage read call to read it out
        const referencedDeclaration = node.vReferencedDeclaration;
        (0, assert_1.default)(referencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration);
        (0, assert_1.default)(referencedDeclaration.vType !== undefined);
        const replacementAccessFunc = actualLoc === solc_typed_ast_1.DataLocation.Storage
            ? utilFuncGen.storage.memberAccess.gen(node)
            : utilFuncGen.memory.memberAccess.gen(node);
        this.replace(node, replacementAccessFunc, undefined, actualLoc, expectedLoc, ast);
        this.dispatchVisit(replacementAccessFunc, ast);
    }
    visitIndexAccess(node, ast) {
        (0, assert_1.default)(node.vIndexExpression !== undefined);
        const [actualLoc, expectedLoc] = this.getLocations(node);
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference);
        let replacement = null;
        if (baseType instanceof solc_typed_ast_1.PointerType) {
            if (actualLoc === solc_typed_ast_1.DataLocation.Storage) {
                if (baseType.to instanceof solc_typed_ast_1.ArrayType) {
                    if (baseType.to.size === undefined) {
                        replacement = ast.getUtilFuncGen(node).storage.dynArrayIndexAccess.gen(node);
                    }
                    else {
                        replacement = ast.getUtilFuncGen(node).storage.staticArrayIndexAccess.gen(node);
                    }
                }
                else if (baseType.to instanceof solc_typed_ast_1.BytesType || baseType.to instanceof solc_typed_ast_1.StringType) {
                    replacement = ast.getUtilFuncGen(node).storage.dynArrayIndexAccess.gen(node);
                }
                else if (baseType.to instanceof solc_typed_ast_1.MappingType) {
                    replacement = ast.getUtilFuncGen(node).storage.mappingIndexAccess.gen(node);
                }
                else {
                    throw new errors_1.TranspileFailedError(`Unexpected index access base type ${(0, astPrinter_1.printTypeNode)(baseType.to)} at ${(0, astPrinter_1.printNode)(node)}`);
                }
            }
            else if (actualLoc === solc_typed_ast_1.DataLocation.Memory) {
                if (baseType.to instanceof solc_typed_ast_1.ArrayType) {
                    if (baseType.to.size === undefined) {
                        replacement = createMemoryDynArrayIndexAccess(node, ast);
                    }
                    else {
                        replacement = ast
                            .getUtilFuncGen(node)
                            .memory.staticArrayIndexAccess.gen(node, baseType.to);
                    }
                }
                else if (baseType.to instanceof solc_typed_ast_1.BytesType || baseType.to instanceof solc_typed_ast_1.StringType) {
                    replacement = createMemoryDynArrayIndexAccess(node, ast);
                }
                else {
                    throw new errors_1.TranspileFailedError(`Unexpected index access base type ${(0, astPrinter_1.printTypeNode)(baseType.to)} at ${(0, astPrinter_1.printNode)(node)}`);
                }
            }
        }
        if (replacement !== null) {
            this.replace(node, replacement, undefined, actualLoc, expectedLoc, ast);
            this.dispatchVisit(replacement, ast);
        }
        else {
            this.visitExpression(node, ast);
        }
    }
}
exports.DataAccessFunctionaliser = DataAccessFunctionaliser;
function createMemoryDynArrayIndexAccess(indexAccess, ast) {
    const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(indexAccess.vBaseExpression, ast.inference))[0];
    const arrayTypeName = (0, utils_1.typeNameFromTypeNode)(arrayType, ast);
    const returnTypeName = arrayTypeName instanceof solc_typed_ast_1.ArrayTypeName
        ? (0, cloning_1.cloneASTNode)(arrayTypeName.vBaseType, ast)
        : (0, nodeTemplates_1.createUint8TypeName)(ast);
    const importedFunc = ast.registerImport(indexAccess, ...importPaths_1.WM_INDEX_DYN, [
        ['arrayLoc', arrayTypeName, solc_typed_ast_1.DataLocation.Memory],
        ['index', (0, nodeTemplates_1.createUint256TypeName)(ast)],
        ['width', (0, nodeTemplates_1.createUint256TypeName)(ast)],
    ], [['loc', returnTypeName, solc_typed_ast_1.DataLocation.Memory]]);
    (0, assert_1.default)(indexAccess.vIndexExpression);
    (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.ArrayType ||
        arrayType instanceof solc_typed_ast_1.BytesType ||
        arrayType instanceof solc_typed_ast_1.StringType);
    const elementCairoTypeWidth = cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.getElementType)(arrayType), ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
    const call = (0, functionGeneration_1.createCallToFunction)(importedFunc, [
        indexAccess.vBaseExpression,
        indexAccess.vIndexExpression,
        (0, nodeTemplates_1.createNumberLiteral)(elementCairoTypeWidth, ast, 'uint256'),
    ], ast);
    return call;
}
function shouldLeaveAsCairoAssignment(lhs) {
    return (lhs instanceof solc_typed_ast_1.Identifier &&
        !(lhs.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration &&
            lhs.vReferencedDeclaration.stateVariable));
}
//# sourceMappingURL=dataAccessFunctionaliser.js.map