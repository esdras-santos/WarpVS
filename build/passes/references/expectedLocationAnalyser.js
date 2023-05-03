"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpectedLocationAnalyser = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const base_1 = require("../../cairoUtilFuncGen/base");
const astPrinter_1 = require("../../utils/astPrinter");
const errors_1 = require("../../utils/errors");
const formatting_1 = require("../../utils/formatting");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const typeConstructs_1 = require("../../utils/typeConstructs");
const utils_1 = require("../../utils/utils");
/*
Analyses the tree top down, marking nodes with the storage location associated
with how they are being used. For example, a struct constructor being assigned
to a storage location would be marked storage, even if the struct is a memory
struct

Prerequisites
TupleAssignmentSplitter - Cannot usefully assign a location to tuple returns
*/
// undefined means unused, default means read
class ExpectedLocationAnalyser extends mapper_1.ASTMapper {
    constructor(actualLocations, expectedLocations) {
        super();
        this.actualLocations = actualLocations;
        this.expectedLocations = expectedLocations;
    }
    visitAssignment(node, ast) {
        const lhsLocation = this.actualLocations.get(node.vLeftHandSide);
        if (lhsLocation === solc_typed_ast_1.DataLocation.Storage) {
            this.expectedLocations.set(node.vLeftHandSide, lhsLocation);
            const rhsLocation = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightHandSide, ast.inference))[1] ??
                solc_typed_ast_1.DataLocation.Default;
            this.expectedLocations.set(node.vRightHandSide, rhsLocation);
        }
        else if (lhsLocation === solc_typed_ast_1.DataLocation.Memory) {
            this.expectedLocations.set(node.vLeftHandSide, lhsLocation);
            const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightHandSide, ast.inference);
            this.expectedLocations.set(node.vRightHandSide, (0, base_1.locationIfComplexType)(rhsType, solc_typed_ast_1.DataLocation.Memory));
        }
        else if (lhsLocation === solc_typed_ast_1.DataLocation.CallData) {
            throw new errors_1.TranspileFailedError(`Left hand side of assignment has calldata location ${(0, astPrinter_1.printNode)(node)}`);
        }
        else if (lhsLocation === solc_typed_ast_1.DataLocation.Default) {
            this.expectedLocations.set(node.vLeftHandSide, lhsLocation);
            this.expectedLocations.set(node.vRightHandSide, solc_typed_ast_1.DataLocation.Default);
        }
        else {
            throw new errors_1.TranspileFailedError(`Left hand side of assignment has undefined location ${(0, astPrinter_1.printNode)(node)}`);
        }
        this.visitExpression(node, ast);
    }
    visitBinaryOperation(node, ast) {
        this.expectedLocations.set(node.vLeftExpression, solc_typed_ast_1.DataLocation.Default);
        this.expectedLocations.set(node.vRightExpression, solc_typed_ast_1.DataLocation.Default);
        this.visitExpression(node, ast);
    }
    visitUnaryOperation(node, ast) {
        if (node.operator === 'delete') {
            const subExpressionLocation = this.actualLocations.get(node.vSubExpression);
            if (subExpressionLocation !== undefined) {
                this.expectedLocations.set(node.vSubExpression, subExpressionLocation);
            }
        }
        else {
            this.expectedLocations.set(node.vSubExpression, solc_typed_ast_1.DataLocation.Default);
        }
        this.visitExpression(node, ast);
    }
    visitFunctionCall(node, ast) {
        if (node.kind === solc_typed_ast_1.FunctionCallKind.TypeConversion) {
            const toType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
            node.vArguments.forEach((arg) => {
                const [type, location] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(arg, ast.inference));
                if ((0, nodeTypeProcessing_1.isDynamicArray)(type) && !(0, nodeTypeProcessing_1.isReferenceType)(toType)) {
                    this.expectedLocations.set(arg, (0, base_1.locationIfComplexType)(type, solc_typed_ast_1.DataLocation.Memory));
                }
                else {
                    this.expectedLocations.set(arg, location ?? solc_typed_ast_1.DataLocation.Default);
                }
            });
            return this.visitExpression(node, ast);
        }
        if (node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin) {
            if (node.vFunctionName === 'push') {
                if (node.vArguments.length > 0) {
                    const actualLoc = this.actualLocations.get(node.vArguments[0]);
                    if (actualLoc) {
                        this.expectedLocations.set(node.vArguments[0], actualLoc);
                    }
                }
                return this.visitExpression(node, ast);
            }
            if (node.vFunctionName === 'concat') {
                node.vArguments.forEach((arg) => this.expectedLocations.set(arg, solc_typed_ast_1.DataLocation.Memory));
                return this.visitExpression(node, ast);
            }
        }
        const parameterTypes = (0, nodeTypeProcessing_1.getParameterTypes)(node, ast);
        // When calling `push`, the function receives two parameters nonetheless the argument is just one
        // This does not explode because javascript does not gives an index out of range exception
        node.vArguments.forEach((arg, index) => {
            // Solc 0.7.0 types push and pop as you would expect, 0.8.0 adds an extra initial argument
            const paramIndex = index + parameterTypes.length - node.vArguments.length;
            const t = parameterTypes[paramIndex];
            if (t instanceof solc_typed_ast_1.PointerType) {
                if (node.kind === solc_typed_ast_1.FunctionCallKind.StructConstructorCall) {
                    // The components of a struct being assigned to a location are also being assigned to that location
                    const expectedLocation = this.expectedLocations.get(node);
                    if (expectedLocation !== undefined && expectedLocation !== solc_typed_ast_1.DataLocation.Default) {
                        this.expectedLocations.set(arg, expectedLocation);
                        return;
                    }
                    // If no expected location, check the type associated with the parent struct constructor
                    const structType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
                    (0, assert_1.default)(structType instanceof solc_typed_ast_1.PointerType);
                    if (structType.location !== solc_typed_ast_1.DataLocation.Default) {
                        this.expectedLocations.set(arg, structType.location);
                    }
                    else {
                        //Finally, default to the type in the pointer itself if we can't infer anything else
                        this.expectedLocations.set(arg, t.location);
                    }
                }
                else if (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition &&
                    node.vReferencedDeclaration.visibility === solc_typed_ast_1.FunctionVisibility.External) {
                    this.expectedLocations.set(arg, solc_typed_ast_1.DataLocation.CallData);
                }
                else {
                    this.expectedLocations.set(arg, t.location);
                }
            }
            else {
                this.expectedLocations.set(arg, solc_typed_ast_1.DataLocation.Default);
            }
        });
        this.visitExpression(node, ast);
    }
    visitIndexAccess(node, ast) {
        (0, assert_1.default)(node.vIndexExpression !== undefined);
        const baseLoc = this.actualLocations.get(node.vBaseExpression);
        (0, assert_1.default)(baseLoc !== undefined);
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference);
        if (baseType instanceof solc_typed_ast_1.FixedBytesType) {
            this.expectedLocations.set(node.vBaseExpression, solc_typed_ast_1.DataLocation.Default);
        }
        else {
            this.expectedLocations.set(node.vBaseExpression, baseLoc);
        }
        if (baseType instanceof solc_typed_ast_1.PointerType &&
            baseType.to instanceof solc_typed_ast_1.MappingType &&
            (0, nodeTypeProcessing_1.isReferenceType)(baseType.to.keyType)) {
            const indexLoc = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vIndexExpression, ast.inference))[1];
            (0, assert_1.default)(indexLoc !== undefined);
            this.expectedLocations.set(node.vIndexExpression, indexLoc);
        }
        else {
            this.expectedLocations.set(node.vIndexExpression, solc_typed_ast_1.DataLocation.Default);
        }
        this.visitExpression(node, ast);
    }
    visitMemberAccess(node, ast) {
        const baseLoc = this.actualLocations.get(node.vExpression);
        const baseNodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        (0, assert_1.default)(baseLoc !== undefined);
        if ((baseNodeType instanceof solc_typed_ast_1.UserDefinedType &&
            baseNodeType.definition instanceof solc_typed_ast_1.ContractDefinition) ||
            baseNodeType instanceof solc_typed_ast_1.FixedBytesType) {
            this.expectedLocations.set(node.vExpression, solc_typed_ast_1.DataLocation.Default);
        }
        else
            this.expectedLocations.set(node.vExpression, baseLoc);
        this.visitExpression(node, ast);
    }
    visitReturn(node, ast) {
        const func = (0, utils_1.getContainingFunction)(node);
        if ((0, utils_1.isExternallyVisible)(func)) {
            if (node.vExpression) {
                // External functions need to read out their returns
                const retExpressions = node.vExpression instanceof solc_typed_ast_1.TupleExpression && !node.vExpression.isInlineArray
                    ? node.vExpression.vOriginalComponents.map((element) => {
                        (0, assert_1.default)(element !== null, `Cannot return tuple with empty slots`);
                        return element;
                    })
                    : [node.vExpression];
                retExpressions.forEach((retExpression) => {
                    const retType = (0, nodeTypeProcessing_1.safeGetNodeType)(retExpression, ast.inference);
                    this.expectedLocations.set(retExpression, (0, base_1.locationIfComplexType)(retType, solc_typed_ast_1.DataLocation.CallData));
                });
            }
            return this.visitStatement(node, ast);
        }
        const retParams = node.vFunctionReturnParameters.vParameters;
        if (retParams.length === 1) {
            (0, assert_1.default)(node.vExpression !== undefined, `expected ${(0, astPrinter_1.printNode)(node)} to return a value`);
            this.expectedLocations.set(node.vExpression, retParams[0].storageLocation);
        }
        else if (retParams.length > 1) {
            (0, assert_1.default)(node.vExpression instanceof solc_typed_ast_1.TupleExpression, `Expected ${(0, astPrinter_1.printNode)(node)} to return a tuple. Has TupleAssignmentSplitter been run?`);
            const subExpressions = node.vExpression.vOriginalComponents;
            (0, assert_1.default)(subExpressions.length === retParams.length, `Expected ${(0, astPrinter_1.printNode)(node)} to have ${retParams.length} members, found ${subExpressions.length}`);
            subExpressions.forEach((subExpression, index) => {
                (0, assert_1.default)(subExpression !== null, `Expected ${(0, astPrinter_1.printNode)(node)} not to contain empty slots`);
                this.expectedLocations.set(subExpression, retParams[index].storageLocation);
            });
        }
        this.visitStatement(node, ast);
    }
    visitTupleExpression(node, ast) {
        const assignedLocation = this.expectedLocations.get(node);
        if (assignedLocation === undefined)
            return this.visitExpression(node, ast);
        node.vOriginalComponents.filter(typeConstructs_1.notNull).forEach((element) => {
            const elementType = (0, nodeTypeProcessing_1.safeGetNodeType)(element, ast.inference);
            this.expectedLocations.set(element, (0, base_1.locationIfComplexType)(elementType, assignedLocation));
        });
        this.visitExpression(node, ast);
    }
    visitVariableDeclarationStatement(node, ast) {
        const declarations = node.assignments.map((id) => {
            if (id === null)
                return null;
            const decl = node.vDeclarations.find((v) => v.id === id);
            (0, assert_1.default)(decl !== undefined, `${(0, astPrinter_1.printNode)(node)} expected to have declaration with id ${id}`);
            return decl;
        });
        if (declarations.length === 1) {
            (0, assert_1.default)(declarations[0] !== null, (0, formatting_1.error)(`expected ${(0, astPrinter_1.printNode)(node)} to assign to a variable`));
            (0, assert_1.default)(node.vInitialValue !== undefined, (0, formatting_1.error)(`expected ${(0, astPrinter_1.printNode)(node)} to assign an initial value`));
            this.expectedLocations.set(node.vInitialValue, declarations[0].storageLocation);
        }
        else if (declarations.length > 1 && node.vInitialValue instanceof solc_typed_ast_1.TupleExpression) {
            const subExpressions = node.vInitialValue.vOriginalComponents;
            (0, assert_1.default)(subExpressions.length === declarations.length, `Expected ${(0, astPrinter_1.printNode)(node)} to have ${declarations.length} members, found ${subExpressions.length}`);
            subExpressions.forEach((subExpression, index) => {
                const declaration = declarations[index];
                if (declaration !== null) {
                    (0, assert_1.default)(subExpression !== null, `Expected ${(0, astPrinter_1.printNode)(node)} to have a value for ${(0, astPrinter_1.printNode)(declaration)}`);
                    this.expectedLocations.set(subExpression, declaration.storageLocation);
                }
            });
        }
        this.visitStatement(node, ast);
    }
    visitCairoAssert(node, ast) {
        this.expectedLocations.set(node.vExpression, solc_typed_ast_1.DataLocation.Default);
        this.visitExpression(node, ast);
    }
    visitIfStatement(node, ast) {
        this.expectedLocations.set(node.vCondition, solc_typed_ast_1.DataLocation.Default);
        this.visitStatement(node, ast);
    }
}
exports.ExpectedLocationAnalyser = ExpectedLocationAnalyser;
//# sourceMappingURL=expectedLocationAnalyser.js.map