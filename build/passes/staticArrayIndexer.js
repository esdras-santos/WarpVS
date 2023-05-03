"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticArrayIndexer = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const errors_1 = require("../utils/errors");
const getTypeString_1 = require("../utils/getTypeString");
const nameModifiers_1 = require("../utils/nameModifiers");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
class StaticArrayIndexer extends mapper_1.ASTMapper {
    constructor() {
        /*
            This pass replace all non literal calldata structures which have a non literal
            index access for a memory one.
            This pass is needed because static arrays are handled as cairo tuples, but cairo
            tuples (for now) can only be indexed by literals
            e.g.
              uint8[3] calldata b = ...
              uint8 x = b[i]
           // gets replaced by:
              uint8[3] calldata b = ...
              uint8[3] memory mem_b  = b
              uint8[x] = mem_b[i]
        
            More complex cases can occur as well, for example when the static array is nested
            inside another structure, then the whole structure is copied to memory
          */
        super(...arguments);
        // Tracks calldata structures which already have a memory counterpart initialized
        this.staticArrayAccessed = new Map();
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitMemberAccess(node, ast) {
        this.staticIndexToMemory(node, ast);
    }
    visitIndexAccess(node, ast) {
        this.staticIndexToMemory(node, ast);
    }
    staticIndexToMemory(node, ast) {
        if (!hasIndexAccess(node, ast)) {
            return this.visitExpression(node, ast);
        }
        const identifier = getReferenceDeclaration(node, ast);
        (0, assert_1.default)(identifier.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration);
        const parentFunction = (0, utils_1.getContainingFunction)(node);
        const refId = identifier.referencedDeclaration;
        let refVarDecl = this.staticArrayAccessed.get(refId);
        if (refVarDecl === undefined) {
            refVarDecl = this.initMemoryArray(identifier, parentFunction, ast);
            this.staticArrayAccessed.set(refId, refVarDecl);
        }
        const indexReplacement = this.setExpressionToMemory(node, refVarDecl, ast);
        ast.context.register(node);
        ast.replaceNode(node, indexReplacement);
    }
    setExpressionToMemory(expr, refVarDecl, ast) {
        const exprType = (0, nodeTypeProcessing_1.safeGetNodeType)(expr, ast.inference);
        const exprMemoryType = (0, nodeTypeProcessing_1.specializeType)((0, solc_typed_ast_1.generalizeType)(exprType)[0], solc_typed_ast_1.DataLocation.Memory);
        let replacement;
        if (expr instanceof solc_typed_ast_1.Identifier) {
            replacement = (0, nodeTemplates_1.createIdentifier)(refVarDecl, ast, solc_typed_ast_1.DataLocation.Memory);
        }
        else if (expr instanceof solc_typed_ast_1.IndexAccess) {
            replacement = new solc_typed_ast_1.IndexAccess(expr.id, expr.src, (0, getTypeString_1.generateExpressionTypeString)(exprMemoryType), this.setExpressionToMemory(expr.vBaseExpression, refVarDecl, ast), expr.vIndexExpression);
        }
        else if (expr instanceof solc_typed_ast_1.MemberAccess) {
            replacement = new solc_typed_ast_1.MemberAccess(expr.id, '', (0, getTypeString_1.generateExpressionTypeString)(exprMemoryType), this.setExpressionToMemory(expr.vExpression, refVarDecl, ast), expr.memberName, expr.referencedDeclaration);
        }
        else {
            throw new errors_1.NotSupportedYetError(`Static array index access with nested expression ${(0, astPrinter_1.printNode)(expr)} is not supported yet`);
        }
        ast.context.unregister(expr);
        return replacement;
    }
    initMemoryArray(identifier, parentFunction, ast) {
        const refId = identifier.referencedDeclaration;
        const memoryType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(identifier, ast.inference))[0];
        const varDecl = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
        false, // indexed
        `${nameModifiers_1.CALLDATA_TO_MEMORY_PREFIX}${identifier.name}`, parentFunction?.id, false, // stateVariable
        solc_typed_ast_1.DataLocation.Memory, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, memoryType.pp(), undefined, (0, utils_1.typeNameFromTypeNode)(memoryType, ast), undefined);
        (0, assert_1.default)(identifier.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration);
        const assignation = (0, nodeTemplates_1.createIdentifier)(identifier.vReferencedDeclaration, ast, solc_typed_ast_1.DataLocation.CallData);
        const varDeclStatement = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', [varDecl.id], [varDecl], assignation);
        ast.setContextRecursive(varDeclStatement);
        ast.setContextRecursive(varDecl);
        if (parentFunction.vParameters.vParameters.some((vd) => vd.id === refId)) {
            parentFunction.vBody?.insertAtBeginning(varDeclStatement);
        }
        else {
            ast.insertStatementAfter(identifier.vReferencedDeclaration, varDeclStatement);
        }
        return varDecl;
    }
}
exports.StaticArrayIndexer = StaticArrayIndexer;
function isCalldataStaticArray(type) {
    return (type instanceof solc_typed_ast_1.PointerType &&
        type.location === solc_typed_ast_1.DataLocation.CallData &&
        type.to instanceof solc_typed_ast_1.ArrayType &&
        type.to.size !== undefined);
}
function hasIndexAccess(node, ast) {
    return ((node instanceof solc_typed_ast_1.IndexAccess &&
        ((isCalldataStaticArray((0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference)) &&
            isIndexedByNonLiteral(node)) ||
            hasIndexAccess(node.vBaseExpression, ast))) ||
        (node instanceof solc_typed_ast_1.MemberAccess && hasIndexAccess(node.vExpression, ast)));
}
function isIndexedByNonLiteral(node) {
    return node.vIndexExpression !== undefined && !(node.vIndexExpression instanceof solc_typed_ast_1.Literal);
}
function getReferenceDeclaration(expr, ast) {
    if (expr instanceof solc_typed_ast_1.Identifier) {
        return expr;
    }
    else if (expr instanceof solc_typed_ast_1.IndexAccess) {
        return getReferenceDeclaration(expr.vBaseExpression, ast);
    }
    else if (expr instanceof solc_typed_ast_1.MemberAccess) {
        return getReferenceDeclaration(expr.vExpression, ast);
    }
    throw new errors_1.TranspileFailedError(`Unexpected expression ${(0, astPrinter_1.printNode)(expr)} while searching for identifier`);
}
//# sourceMappingURL=staticArrayIndexer.js.map