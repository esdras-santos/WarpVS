"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleFiller = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
const defaultValueNodes_1 = require("../../utils/defaultValueNodes");
const nameModifiers_1 = require("../../utils/nameModifiers");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const typeConstructs_1 = require("../../utils/typeConstructs");
const utils_1 = require("../../utils/utils");
class TupleFiller extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.counter = 0;
    }
    visitAssignment(node, ast) {
        if (!(node.vLeftHandSide instanceof solc_typed_ast_1.TupleExpression) ||
            node.vLeftHandSide.vOriginalComponents.every(typeConstructs_1.notNull)) {
            return this.visitExpression(node, ast);
        }
        const scope = node.getClosestParentBySelector((p) => p instanceof solc_typed_ast_1.FunctionDefinition || p instanceof solc_typed_ast_1.ModifierDefinition)?.id;
        (0, assert_1.default)(scope !== undefined, `Unable to find scope for tuple assignment. ${(0, astPrinter_1.printNode)(node)}`);
        // We are now looking at a tuple with empty slots on the left hand side of the assignment
        // There is a known bug with getNodeType when passed such tuples, so we must fill them
        // or remove the slot if the rhs has no side effects
        const lhs = node.vLeftHandSide;
        lhs.vOriginalComponents
            .map((value, index) => (value === null ? index : null))
            .filter(typeConstructs_1.notNull)
            .forEach((emptyIndex) => {
            if (shouldRemove(node.vRightHandSide, emptyIndex))
                return;
            const tupleType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightHandSide, ast.inference);
            (0, assert_1.default)(tupleType instanceof solc_typed_ast_1.TupleType, `Expected rhs of tuple assignment to be tuple type, got ${(0, astPrinter_1.printTypeNode)(tupleType)} at ${(0, astPrinter_1.printNode)(node)}`);
            const elementType = tupleType.elements[emptyIndex];
            const [generalisedType, loc] = (0, solc_typed_ast_1.generalizeType)(elementType);
            const typeName = (0, utils_1.typeNameFromTypeNode)(elementType, ast);
            const declaration = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
            false, // indexed
            `${nameModifiers_1.TUPLE_FILLER_PREFIX}${this.counter++}`, scope, false, // stateVariable
            loc ?? solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Default, solc_typed_ast_1.Mutability.Mutable, generalisedType.pp(), undefined, typeName);
            ast.insertStatementBefore(node, (0, nodeTemplates_1.createVariableDeclarationStatement)([declaration], (0, defaultValueNodes_1.getDefaultValue)(elementType, declaration, ast), ast));
            const child = (0, nodeTemplates_1.createIdentifier)(declaration, ast);
            lhs.vOriginalComponents[emptyIndex] = child;
            ast.registerChild(child, lhs);
        });
        if (node.vRightHandSide instanceof solc_typed_ast_1.TupleExpression) {
            const toRemove = lhs.vOriginalComponents
                .map((value, index) => (value === null ? index : null))
                .filter(typeConstructs_1.notNull);
            lhs.vOriginalComponents = lhs.vOriginalComponents.filter((_value, index) => !toRemove.includes(index));
            node.vRightHandSide.vOriginalComponents = node.vRightHandSide.vOriginalComponents.filter((_value, index) => !toRemove.includes(index));
            updateTypeString(node.vRightHandSide);
        }
        updateTypeString(node.vLeftHandSide);
    }
}
exports.TupleFiller = TupleFiller;
function shouldRemove(rhs, index) {
    if (!(rhs instanceof solc_typed_ast_1.TupleExpression))
        return false;
    const elem = rhs.vOriginalComponents[index];
    return elem === null || !(0, utils_1.expressionHasSideEffects)(elem);
}
function updateTypeString(node) {
    node.typeString = `tuple(${node.vComponents.map((value) => value.typeString)})`;
}
//# sourceMappingURL=tupleFiller.js.map