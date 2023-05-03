"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AST = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoUtilFuncGen_1 = require("../cairoUtilFuncGen");
const astPrinter_1 = require("../utils/astPrinter");
const errors_1 = require("../utils/errors");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const importFuncGenerator_1 = require("../utils/importFuncGenerator");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
/*
 A centralised store of information required for transpilation, a reference
 to the AST is passed around during processing so that such information is
 always available.
 Both contains members that exist in the original compilation data, such as
 compilerVersion and context, that are generally inconvenient to access from
 arbitrary points in the tree, as well as holding information we create during
 the course of transpilation such as the import mappings.

 When creating nodes, it is important to assign their context. There are 3 ways
 to do this:
 - setContextRecursive is the most basic and handles the given node and all children
 - registerChild is for when you add a child node, it ensures both contexts and parent
 links are set correctly
 - replaceNode is for when you need to replace the current node that is being visited
 with a new one. Should only be used where necessary as it can be used to get around
 the type system. If the new node is of the same type as the current one, assigning to
 members of the existing node is preferred
*/
class AST {
    constructor(roots, compilerVersion, solidityABI) {
        this.roots = roots;
        this.solidityABI = solidityABI;
        // SourceUnit id -> CairoUtilFuncGen
        this.cairoUtilFuncGen = new Map();
        this.tempId = -1;
        (0, assert_1.default)(roots.length > 0, 'An ast must have at least one root so that the context can be set correctly');
        (0, assert_1.default)(roots.every((sourceUnit) => sourceUnit.requiredContext === roots[0].requiredContext), 'All contexts should be the same, otherwise they are from separate solc-typed-ast compiles and they will have no relationship to each other.');
        this.context = roots[0].requiredContext;
        this.inference = new solc_typed_ast_1.InferType(compilerVersion);
        (0, assert_1.default)(this.context.locate(this.tempId) === undefined, `Attempted to create an AST with a context that already has ${this.tempId} registered`);
    }
    extractToConstant(node, vType, newName) {
        const scope = this.getContainingScope(node);
        let location;
        if (node instanceof solc_typed_ast_1.FunctionCall && (0, utils_1.isExternalCall)(node)) {
            location =
                (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.inference))[1] === undefined
                    ? solc_typed_ast_1.DataLocation.Default
                    : solc_typed_ast_1.DataLocation.CallData;
        }
        else {
            location = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.inference))[1] ?? solc_typed_ast_1.DataLocation.Default;
        }
        const replacementVariable = new solc_typed_ast_1.VariableDeclaration(this.tempId, node.src, true, // constant
        false, // indexed
        newName, scope, false, // stateVariable
        location, solc_typed_ast_1.StateVariableVisibility.Private, solc_typed_ast_1.Mutability.Constant, node.typeString, undefined, vType);
        this.setContextRecursive(replacementVariable);
        const declaration = new solc_typed_ast_1.VariableDeclarationStatement(this.tempId, node.src, [replacementVariable.id], [replacementVariable]);
        this.insertStatementBefore(node, declaration);
        const replacementIdentifier = new solc_typed_ast_1.Identifier(this.tempId, node.src, node.typeString, newName, replacementVariable.id, node.raw);
        this.replaceNode(node, replacementIdentifier);
        declaration.vInitialValue = node;
        this.registerChild(node, declaration);
        return [replacementIdentifier, declaration];
    }
    getContainingRoot(node) {
        if (node instanceof solc_typed_ast_1.SourceUnit)
            return node;
        const root = (0, utils_1.getContainingSourceUnit)(node);
        (0, assert_1.default)(this.roots.includes(root), `Found ${(0, astPrinter_1.printNode)(root)} as root of ${(0, astPrinter_1.printNode)(node)}, but this is not in the AST roots`);
        return root;
    }
    getContainingScope(node) {
        const scope = node.getClosestParentBySelector((node) => node instanceof solc_typed_ast_1.Block || node instanceof solc_typed_ast_1.UncheckedBlock);
        if (scope === undefined) {
            // post-audit TODO improve this to always produce the scope and to follow solc-typed-ast's
            // rules for scope being lexical scope
            console.log(`WARNING: Unable to find scope of ${(0, astPrinter_1.printNode)(node)}`);
            return -1;
        }
        return scope.id;
    }
    getUtilFuncGen(node) {
        const sourceUnit = node instanceof solc_typed_ast_1.SourceUnit ? node : (0, utils_1.getContainingSourceUnit)(node);
        const gen = this.cairoUtilFuncGen.get(sourceUnit.id);
        if (gen === undefined) {
            const newGen = new cairoUtilFuncGen_1.CairoUtilFuncGen(this, sourceUnit);
            this.cairoUtilFuncGen.set(sourceUnit.id, newGen);
            return newGen;
        }
        return gen;
    }
    insertStatementAfter(existingNode, newStatement) {
        const existingStatementRoot = existingNode.getClosestParentByType(solc_typed_ast_1.SourceUnit);
        (0, assert_1.default)(existingStatementRoot !== undefined, `Attempted to insert statement ${(0, astPrinter_1.printNode)(newStatement)} before ${(0, astPrinter_1.printNode)(existingNode)} which is not a child of a source unit`);
        (0, assert_1.default)(this.roots.includes(existingStatementRoot), `Existing node root: #${existingStatementRoot.id} is not in the ast roots: ${this.roots.map((su) => '#' + su.id)}`);
        // Find the statement that newStatement needs to go in front of
        const existingStatement = existingNode instanceof solc_typed_ast_1.Statement || existingNode instanceof solc_typed_ast_1.StatementWithChildren
            ? existingNode
            : existingNode.getClosestParentBySelector((parent) => parent instanceof solc_typed_ast_1.Statement || parent instanceof solc_typed_ast_1.StatementWithChildren);
        (0, assert_1.default)(existingStatement !== undefined, `Unable to find containing statement for ${(0, astPrinter_1.printNode)(existingNode)}`);
        if (existingStatement.parent instanceof solc_typed_ast_1.Block ||
            existingStatement.parent instanceof solc_typed_ast_1.UncheckedBlock) {
            // This sets the parent but not the context
            existingStatement.parent.insertAfter(newStatement, existingStatement);
            this.setContextRecursive(newStatement);
            return;
        }
        const parent = existingStatement.parent;
        // Blocks are not instances of Statements, but they satisfy typescript shaped typing rules to be classed as Statements
        const replacementBlock = (0, nodeTemplates_1.createBlock)([existingStatement, newStatement], this);
        this.replaceNode(existingStatement, replacementBlock, parent);
    }
    insertStatementBefore(existingNode, newStatement) {
        const existingStatementRoot = existingNode.getClosestParentByType(solc_typed_ast_1.SourceUnit);
        (0, assert_1.default)(existingStatementRoot !== undefined, `Attempted to insert statement ${(0, astPrinter_1.printNode)(newStatement)} before ${(0, astPrinter_1.printNode)(existingNode)} which is not a child of a source unit`);
        (0, assert_1.default)(this.roots.includes(existingStatementRoot), `Existing node root: #${existingStatementRoot.id} is not in the ast roots: ${this.roots.map((su) => '#' + su.id)}`);
        // Find the statement that newStatement needs to go in front of
        const existingStatement = existingNode instanceof solc_typed_ast_1.Statement || existingNode instanceof solc_typed_ast_1.StatementWithChildren
            ? existingNode
            : existingNode.getClosestParentBySelector((parent) => parent instanceof solc_typed_ast_1.Statement || parent instanceof solc_typed_ast_1.StatementWithChildren);
        (0, assert_1.default)(existingStatement !== undefined, `Unable to find containing statement for ${(0, astPrinter_1.printNode)(existingNode)}`);
        if (existingStatement.parent instanceof solc_typed_ast_1.Block ||
            existingStatement.parent instanceof solc_typed_ast_1.UncheckedBlock) {
            // This sets the parent but not the context
            existingStatement.parent.insertBefore(newStatement, existingStatement);
            this.setContextRecursive(newStatement);
            return;
        }
        const parent = existingStatement.parent;
        // Blocks are not instances of Statements, but they satisfy typescript shaped typing rules to be classed as Statements
        const replacementBlock = (0, nodeTemplates_1.createBlock)([newStatement, existingStatement], this);
        this.replaceNode(existingStatement, replacementBlock, parent);
    }
    registerChild(child, parent) {
        this.setContextRecursive(child);
        child.parent = parent;
        (0, assert_1.default)(parent.children.includes(child), `Child ${(0, astPrinter_1.printNode)(child)} not found in parent ${(0, astPrinter_1.printNode)(parent)}'s children`);
        return child.id;
    }
    registerImport(node, location, name, inputs, outputs, options) {
        return (0, importFuncGenerator_1.createImport)(location, name, node, this, inputs, outputs, options);
    }
    removeStatement(statement) {
        const parent = statement.parent;
        (0, assert_1.default)(parent !== undefined, `${(0, astPrinter_1.printNode)(statement)} has no parent`);
        if (parent instanceof solc_typed_ast_1.StatementWithChildren) {
            parent.removeChild(statement);
        }
        else {
            this.replaceNode(statement, (0, nodeTemplates_1.createBlock)([], this, statement.documentation));
        }
    }
    replaceNode(oldNode, newNode, parent) {
        if (oldNode === newNode) {
            console.log(`WARNING: Attempted to replace node ${(0, astPrinter_1.printNode)(oldNode)} with itself`);
            return oldNode.id;
        }
        if (parent === undefined) {
            if (newNode.getChildren().includes(oldNode)) {
                throw new errors_1.TranspileFailedError('Parent must be provided when replacing a node with a subtree containing that node');
            }
            else {
                parent = oldNode.parent;
                if (oldNode.parent === undefined) {
                    console.log(`WARNING: Attempting to replace ${(0, astPrinter_1.printNode)(oldNode)} which has no parent`);
                }
                oldNode.parent = undefined;
            }
        }
        else if (newNode.getChildren(true).includes(parent)) {
            throw new errors_1.TranspileFailedError(`Attempted to insert a subtree containing the given parent node ${(0, astPrinter_1.printNode)(parent)}`);
        }
        replaceNode(oldNode, newNode, parent);
        this.context.unregister(oldNode);
        this.setContextRecursive(newNode);
        return newNode.id;
    }
    reserveId() {
        return reserveSafeId(this.context);
    }
    setContextRecursive(node) {
        node.walk((n) => {
            if (n.id === this.tempId) {
                n.id = this.reserveId();
            }
            if (!this.context.contains(n)) {
                if (n.context !== undefined) {
                    throw new errors_1.TranspileFailedError(`Context defined incorrectly during setContextRecursive for node ${(0, astPrinter_1.printNode)(n)}`);
                }
                if (this.context.locate(n.id)) {
                    throw new errors_1.TranspileFailedError(`Attempted to register ${(0, astPrinter_1.printNode)(n)} with context, when ${(0, astPrinter_1.printNode)(this.context.locate(n.id))} has same id`);
                }
                this.context.register(n);
            }
        });
        return node.id;
    }
}
exports.AST = AST;
// Based on the solc-typed-ast replaceNode function, but with adjustments for contexts
function replaceNode(oldNode, newNode, parent) {
    if (newNode.context !== undefined && oldNode.context !== newNode.context) {
        throw new errors_1.TranspileFailedError('Context mismatch');
    }
    if (parent === undefined) {
        return;
    }
    const ownProps = Object.getOwnPropertyDescriptors(parent);
    for (const name in ownProps) {
        const val = ownProps[name].value;
        if (val === oldNode) {
            Object.assign(parent, Object.fromEntries([[name, newNode]]));
            parent.acceptChildren();
            return;
        }
        if (val instanceof Array) {
            for (let i = 0; i < val.length; i++) {
                if (val[i] === oldNode) {
                    val[i] = newNode;
                    parent.acceptChildren();
                    return;
                }
            }
        }
        if (val instanceof Map) {
            for (const [k, v] of val.entries()) {
                if (v === oldNode) {
                    val.set(k, newNode);
                    parent.acceptChildren();
                    return;
                }
            }
        }
    }
    throw new errors_1.TranspileFailedError(`Couldn't find child ${oldNode.type}#${oldNode.id} under parent ${parent.type}#${parent.id}`);
}
//----------------------------------Safe ids-----------------------------------
// Different source units can share contexts
// This means ASTs have to share a registry of reserved ids
// TODO now that AST contains multiple roots, this may not be necessary
const _safeIds = new Map();
function reserveSafeId(context) {
    const id = _safeIds.get(context);
    if (id === undefined) {
        _safeIds.set(context, context.lastId + 2);
        return context.lastId + 1;
    }
    else {
        _safeIds.set(context, id + 1);
        return id;
    }
}
//# sourceMappingURL=ast.js.map