"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeNameRemover = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_2 = require("solc-typed-ast");
const typeConstructs_1 = require("../utils/typeConstructs");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
class TypeNameRemover extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitExpressionStatement(node, ast) {
        if ((node.vExpression instanceof solc_typed_ast_1.IndexAccess ||
            node.vExpression instanceof solc_typed_ast_1.MemberAccess ||
            node.vExpression instanceof solc_typed_ast_1.Identifier ||
            node.vExpression instanceof solc_typed_ast_1.ElementaryTypeNameExpression) &&
            (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference) instanceof solc_typed_ast_1.TypeNameType) {
            ast.removeStatement(node);
        }
        else if (node.vExpression instanceof solc_typed_ast_2.TupleExpression) {
            this.visitTupleExpression(node.vExpression, ast);
        }
    }
    visitTupleExpression(node, ast) {
        node.vOriginalComponents.forEach((n) => {
            if (n instanceof solc_typed_ast_2.TupleExpression) {
                this.visitTupleExpression(n, ast);
            }
        });
        node.vOriginalComponents = node.vOriginalComponents.filter((n, index) => !this.isTypeNameType(node, index, ast));
    }
    visitVariableDeclarationStatement(node, ast) {
        if (!(node.vInitialValue instanceof solc_typed_ast_2.TupleExpression) || node.assignments.every(typeConstructs_1.notNull)) {
            return this.commonVisit(node, ast);
        }
        // We are now looking at a tuple with empty slots on the left hand side of the VariableDeclaration.
        // We want to investigate whether there is a TypeNameType expressions looking to fill that empty slot.
        // If there is we need to remove that expression since they are not supported.
        const rhs = node.vInitialValue;
        (0, assert_1.default)(rhs instanceof solc_typed_ast_2.TupleExpression);
        const lhs = node.assignments;
        const emptySlots = node.assignments
            .map((value, index) => (value === null ? index : null))
            .filter(typeConstructs_1.notNull);
        const typeNameTypeSlots = rhs.vOriginalComponents
            .map((_value, index) => (this.isTypeNameType(rhs, index, ast) ? index : null))
            .filter(typeConstructs_1.notNull);
        node.assignments = lhs.filter((_value, index) => !emptySlots.includes(index) || !typeNameTypeSlots.includes(index));
        rhs.vOriginalComponents = rhs.vOriginalComponents.filter((_value, index) => !emptySlots.includes(index) || !typeNameTypeSlots.includes(index));
        updateTypeString(rhs);
    }
    isTypeNameType(rhs, index, ast) {
        if (!(rhs instanceof solc_typed_ast_2.TupleExpression))
            return false;
        const elem = rhs.vOriginalComponents[index];
        return elem !== null ? (0, nodeTypeProcessing_1.safeGetNodeType)(elem, ast.inference) instanceof solc_typed_ast_1.TypeNameType : false;
    }
}
exports.TypeNameRemover = TypeNameRemover;
function updateTypeString(node) {
    node.typeString = `tuple(${node.vComponents.map((value) => value.typeString)})`;
}
//# sourceMappingURL=typeNameRemover.js.map