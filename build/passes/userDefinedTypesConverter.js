"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDefinedTypesConverter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const assert_1 = __importDefault(require("assert"));
const mapper_1 = require("../ast/mapper");
const getTypeString_1 = require("../utils/getTypeString");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
class UserDefinedValueTypeDefinitionEliminator extends mapper_1.ASTMapper {
    visitUserDefinedValueTypeDefinition(node, _ast) {
        node.vScope.removeChild(node);
    }
}
class UserDefinedTypesConverter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitVariableDeclaration(node, ast) {
        this.commonVisit(node, ast);
        const replacementNode = replaceUserDefinedType((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference), ast.inference);
        node.typeString = (0, getTypeString_1.generateExpressionTypeString)(replacementNode);
    }
    visitTypeName(node, ast) {
        this.commonVisit(node, ast);
        const tNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        const replacementNode = replaceUserDefinedType(tNode, ast.inference);
        if (tNode.pp() !== replacementNode.pp()) {
            node.typeString = (0, getTypeString_1.generateExpressionTypeString)(replacementNode);
        }
    }
    visitExpression(node, ast) {
        this.commonVisit(node, ast);
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        const replacementNode = replaceUserDefinedType(nodeType, ast.inference);
        node.typeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, replacementNode, ast.inference);
    }
    visitUserDefinedTypeName(node, ast) {
        const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        (0, assert_1.default)(typeNode instanceof solc_typed_ast_1.UserDefinedType, 'Expected UserDefinedType');
        if (!(typeNode.definition instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition))
            return;
        ast.replaceNode(node, new solc_typed_ast_1.ElementaryTypeName(node.id, node.src, typeNode.definition.underlyingType.typeString, typeNode.definition.underlyingType.typeString));
    }
    visitFunctionCall(node, ast) {
        if (node.vExpression instanceof solc_typed_ast_1.MemberAccess) {
            if (['unwrap', 'wrap'].includes(node.vExpression.memberName)) {
                const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression.vExpression, ast.inference);
                this.commonVisit(node, ast);
                if (!(typeNode instanceof solc_typed_ast_1.TypeNameType))
                    return;
                if (!(typeNode.type instanceof solc_typed_ast_1.UserDefinedType))
                    return;
                if (!(typeNode.type.definition instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition))
                    return;
                ast.replaceNode(node, node.vArguments[0]);
            }
            else
                this.visitExpression(node, ast);
        }
        else
            this.visitExpression(node, ast);
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            const mapper = new this();
            mapper.dispatchVisit(root, ast);
        });
        ast.roots.forEach((root) => {
            const mapper = new UserDefinedValueTypeDefinitionEliminator();
            mapper.dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.UserDefinedTypesConverter = UserDefinedTypesConverter;
function replaceUserDefinedType(type, inference) {
    const callSelf = (type) => replaceUserDefinedType(type, inference);
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return new solc_typed_ast_1.ArrayType(callSelf(type.elementT), type.size, type.src);
    }
    else if (type instanceof solc_typed_ast_1.FunctionType) {
        return new solc_typed_ast_1.FunctionType(type.name, type.parameters.map(callSelf), type.returns.map(callSelf), type.visibility, type.mutability, type.implicitFirstArg, type.src);
    }
    else if (type instanceof solc_typed_ast_1.MappingType) {
        return new solc_typed_ast_1.MappingType(callSelf(type.keyType), callSelf(type.valueType), type.src);
    }
    else if (type instanceof solc_typed_ast_1.PointerType) {
        return new solc_typed_ast_1.PointerType(callSelf(type.to), type.location, type.kind, type.src);
    }
    else if (type instanceof solc_typed_ast_1.TupleType) {
        return new solc_typed_ast_1.TupleType(type.elements.map(callSelf), type.src);
    }
    else if (type instanceof solc_typed_ast_1.TypeNameType) {
        return new solc_typed_ast_1.TypeNameType(callSelf(type.type), type.src);
    }
    else if (type instanceof solc_typed_ast_1.UserDefinedType) {
        if (type.definition instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition) {
            return inference.typeNameToTypeNode(type.definition.underlyingType);
        }
        else
            return type;
    }
    else {
        return type;
    }
}
//# sourceMappingURL=userDefinedTypesConverter.js.map