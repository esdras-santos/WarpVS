"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumConverter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const assert_1 = __importDefault(require("assert"));
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
const getTypeString_1 = require("../utils/getTypeString");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
class EnumConverter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    getEnumValue(node, memberName) {
        const val = node.vMembers.map((ev) => ev.name).indexOf(memberName);
        if (val < 0) {
            throw new errors_1.TranspileFailedError(`${memberName} is not a member of ${node.name}`);
        }
        return val;
    }
    visitFunctionCall(node, ast) {
        this.visitExpression(node, ast);
        if (node.kind !== solc_typed_ast_1.FunctionCallKind.TypeConversion)
            return;
        const tNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        (0, assert_1.default)(tNode instanceof solc_typed_ast_1.TypeNameType, `Got non-typename type ${tNode.pp()} when parsing conversion function
     ${node.vFunctionName}`);
        if ((node.vExpression instanceof solc_typed_ast_1.Identifier &&
            node.vExpression.vReferencedDeclaration instanceof solc_typed_ast_1.EnumDefinition) ||
            (node.vExpression instanceof solc_typed_ast_1.MemberAccess &&
                node.vExpression.vReferencedDeclaration instanceof solc_typed_ast_1.EnumDefinition)) {
            node.vExpression.typeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, replaceEnumType(tNode), ast.inference);
            ast.replaceNode(node.vExpression, new solc_typed_ast_1.ElementaryTypeNameExpression(node.vExpression.id, node.vExpression.src, node.vExpression.typeString, new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), node.vExpression.vReferencedDeclaration.src, node.vExpression.typeString, node.vExpression.typeString)));
        }
    }
    visitTypeName(node, ast) {
        this.commonVisit(node, ast);
        const tNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        const replacementNode = replaceEnumType(tNode);
        if (tNode.pp() !== replacementNode.pp()) {
            node.typeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, replacementNode, ast.inference);
        }
    }
    visitUserDefinedTypeName(node, ast) {
        const tNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        (0, assert_1.default)(tNode instanceof solc_typed_ast_1.UserDefinedType, 'Expected UserDefinedType');
        if (!(tNode.definition instanceof solc_typed_ast_1.EnumDefinition))
            return;
        const newTypeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, replaceEnumType(tNode), ast.inference);
        ast.replaceNode(node, new solc_typed_ast_1.ElementaryTypeName(node.id, node.src, newTypeString, newTypeString));
    }
    visitVariableDeclaration(node, ast) {
        this.commonVisit(node, ast);
        const typeNode = replaceEnumType((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference));
        node.typeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, typeNode, ast.inference);
    }
    visitExpression(node, ast) {
        this.commonVisit(node, ast);
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (type instanceof solc_typed_ast_1.StringLiteralType) {
            return;
        }
        const typeNode = replaceEnumType(type);
        node.typeString = (0, getTypeString_1.generateExpressionTypeStringForASTNode)(node, typeNode, ast.inference);
    }
    visitMemberAccess(node, ast) {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        if (type instanceof solc_typed_ast_1.UserDefinedType &&
            type.definition instanceof solc_typed_ast_1.EnumDefinition &&
            baseType instanceof solc_typed_ast_1.TypeNameType &&
            baseType.type instanceof solc_typed_ast_1.UserDefinedType &&
            baseType.type.definition instanceof solc_typed_ast_1.EnumDefinition) {
            const intLiteral = this.getEnumValue(type.definition, node.memberName);
            ast.replaceNode(node, (0, nodeTemplates_1.createNumberLiteral)(intLiteral, ast, (0, solc_typed_ast_1.enumToIntType)(type.definition).pp()));
            return;
        }
        this.visitExpression(node, ast);
    }
}
exports.EnumConverter = EnumConverter;
function replaceEnumType(type) {
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return new solc_typed_ast_1.ArrayType(replaceEnumType(type.elementT), type.size, type.src);
    }
    else if (type instanceof solc_typed_ast_1.FunctionType) {
        return new solc_typed_ast_1.FunctionType(type.name, type.parameters.map(replaceEnumType), type.returns.map(replaceEnumType), type.visibility, type.mutability, type.implicitFirstArg, type.src);
    }
    else if (type instanceof solc_typed_ast_1.MappingType) {
        return new solc_typed_ast_1.MappingType(replaceEnumType(type.keyType), replaceEnumType(type.valueType), type.src);
    }
    else if (type instanceof solc_typed_ast_1.PointerType) {
        return new solc_typed_ast_1.PointerType(replaceEnumType(type.to), type.location, type.kind, type.src);
    }
    else if (type instanceof solc_typed_ast_1.TupleType) {
        return new solc_typed_ast_1.TupleType(type.elements.map(replaceEnumType), type.src);
    }
    else if (type instanceof solc_typed_ast_1.TypeNameType) {
        return new solc_typed_ast_1.TypeNameType(replaceEnumType(type.type), type.src);
    }
    else if (type instanceof solc_typed_ast_1.UserDefinedType) {
        if (type.definition instanceof solc_typed_ast_1.EnumDefinition)
            return (0, solc_typed_ast_1.enumToIntType)(type.definition);
        else
            return type;
    }
    else
        return type;
}
//# sourceMappingURL=enumConverter.js.map