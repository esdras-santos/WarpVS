"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationExpressionSplitter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const errors_1 = require("../utils/errors");
const nameModifiers_1 = require("../utils/nameModifiers");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const typeConstructs_1 = require("../utils/typeConstructs");
const utils_1 = require("../utils/utils");
class VariableDeclarationExpressionSplitter extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.lastUsedConstantId = 0;
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    generateNewConstantName() {
        return `${nameModifiers_1.SPLIT_VARIABLE_PREFIX}${this.lastUsedConstantId++}`;
    }
    visitBlock(node, ast) {
        // Recurse first to handle nested blocks
        // CommonVisiting a block will not split direct children of the block as that is done via visitStatementList
        this.commonVisit(node, ast);
        this.visitStatementList(node, ast);
    }
    visitUncheckedBlock(node, ast) {
        this.commonVisit(node, ast);
        this.visitStatementList(node, ast);
    }
    visitStatementList(node, ast) {
        const replacements = node.children
            .map((statement) => {
            if (statement instanceof solc_typed_ast_1.VariableDeclarationStatement) {
                return [statement, this.splitDeclaration(statement, ast)];
            }
            else {
                return null;
            }
        })
            .filter(typeConstructs_1.notNull);
        replacements.forEach((value) => {
            const [oldStatement, splitDeclaration] = value;
            if (splitDeclaration.length === 1 && oldStatement === splitDeclaration[0])
                return;
            if (splitDeclaration.length === 0)
                return;
            if (splitDeclaration[0] !== oldStatement) {
                ast.replaceNode(oldStatement, splitDeclaration[0]);
            }
            splitDeclaration.slice(1).forEach((declaration, index) => {
                node.insertAfter(declaration, splitDeclaration[index]);
                ast.registerChild(declaration, node);
            });
        });
    }
    // e.g. (int a, int b, , ) = (e(), , g(),); => int a = e(); int b; g();
    splitDeclaration(node, ast) {
        const initialValue = node.vInitialValue;
        (0, assert_1.default)(initialValue !== undefined, 'Expected variables to be initialised when running variable declaration expression splitter (did you run variable declaration initialiser?)');
        const initialValueType = (0, nodeTypeProcessing_1.safeGetNodeType)(initialValue, ast.inference);
        if (!(initialValueType instanceof solc_typed_ast_1.TupleType)) {
            return [node];
        }
        // In the case of (int a, int b) = f(), types that don't exactly match need to be extracted
        if (initialValue instanceof solc_typed_ast_1.FunctionCall) {
            const newDeclarationStatements = [];
            const newAssignedIds = node.assignments.map((id, index) => {
                if (id === null)
                    return null;
                const oldDeclaration = node.vDeclarations.find((decl) => decl.id === id);
                (0, assert_1.default)(oldDeclaration !== undefined, `${(0, astPrinter_1.printNode)(node)} has no declaration for id ${id}`);
                if (oldDeclaration.typeString === initialValueType.elements[index].pp()) {
                    // If types are correct there's no need to create a new variable
                    return id;
                }
                else {
                    const currentTypeNode = initialValueType.elements[index];
                    const newTypeName = (0, utils_1.typeNameFromTypeNode)(currentTypeNode, ast);
                    // This is the replacement variable in the tuple assignment
                    const newDeclaration = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), node.src, true, // constant
                    false, // indexed
                    this.generateNewConstantName(), oldDeclaration.scope, false, // stateVariable
                    oldDeclaration.storageLocation, solc_typed_ast_1.StateVariableVisibility.Default, solc_typed_ast_1.Mutability.Constant, newTypeName.typeString, undefined, newTypeName);
                    node.vDeclarations.push(newDeclaration);
                    ast.registerChild(newDeclaration, node);
                    // We now declare the variable that used to be inside the tuple
                    const newDeclarationStatement = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), node.src, [oldDeclaration.id], [oldDeclaration], (0, nodeTemplates_1.createIdentifier)(newDeclaration, ast));
                    newDeclarationStatements.push(newDeclarationStatement);
                    ast.setContextRecursive(newDeclarationStatement);
                    return newDeclaration.id;
                }
            });
            node.assignments = newAssignedIds;
            node.vDeclarations = node.vDeclarations.filter((decl) => node.assignments.includes(decl.id));
            return [node, ...newDeclarationStatements];
        }
        else if (initialValue instanceof solc_typed_ast_1.TupleExpression) {
            // Since Solidity 0.5.0 tuples on either side of an assignment must be of equal size
            return node.assignments
                .map((declId, tupleIndex) => {
                const exprToAssign = initialValue.vOriginalComponents[tupleIndex];
                // This happens when the lhs has an empty slot
                // The rhs is fully evaluated, so this cannot be ignored because of side effects
                if (declId === null) {
                    if (exprToAssign === null)
                        return null;
                    return new solc_typed_ast_1.ExpressionStatement(ast.reserveId(), initialValue.src, // TODO could make this more accurate
                    exprToAssign, tupleIndex === 0 ? node.documentation : undefined, tupleIndex === 0 ? node.raw : undefined);
                }
                else {
                    const decl = node.vDeclarations.find((child) => child.id === declId);
                    (0, assert_1.default)(decl !== undefined, `VariableDeclarationStatement #${node.id} has no declaration for id ${declId}`);
                    return new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), node.src, // TODO could make this more accurate
                    [declId], [decl], exprToAssign ?? undefined, tupleIndex === 0 ? node.documentation : undefined, tupleIndex === 0 ? node.raw : undefined);
                }
            })
                .filter(typeConstructs_1.notNull);
        }
        throw new errors_1.TranspileFailedError(`Don't know how to destructure ${node.type}`);
    }
}
exports.VariableDeclarationExpressionSplitter = VariableDeclarationExpressionSplitter;
//# sourceMappingURL=variableDeclarationExpressionSplitter.js.map