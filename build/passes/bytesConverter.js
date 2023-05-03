"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BytesConverter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const functionGeneration_1 = require("../utils/functionGeneration");
const getTypeString_1 = require("../utils/getTypeString");
const utils_1 = require("../utils/utils");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const importPaths_1 = require("../utils/importPaths");
/* Convert fixed-size byte arrays (e.g. bytes2, bytes8) to their equivalent unsigned integer.
    This pass does not handle dynamically-sized bytes arrays (i.e. bytes).
*/
class BytesConverter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitExpression(node, ast) {
        const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (typeNode instanceof solc_typed_ast_1.StringLiteralType) {
            return;
        }
        node.typeString = (0, getTypeString_1.generateExpressionTypeString)(replaceBytesType(typeNode));
        this.commonVisit(node, ast);
    }
    visitVariableDeclaration(node, ast) {
        const typeNode = replaceBytesType((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference));
        node.typeString = (0, getTypeString_1.generateExpressionTypeString)(typeNode);
        this.commonVisit(node, ast);
    }
    visitElementaryTypeName(node, ast) {
        const typeNode = ast.inference.typeNameToTypeNode(node);
        if (typeNode instanceof solc_typed_ast_1.StringType || typeNode instanceof solc_typed_ast_1.BytesType) {
            ast.replaceNode(node, (0, nodeTemplates_1.createArrayTypeName)((0, nodeTemplates_1.createUint8TypeName)(ast), ast));
            return;
        }
        const replacementTypeNode = replaceBytesType(typeNode);
        if (typeNode.pp() !== replacementTypeNode.pp()) {
            const typeString = replacementTypeNode.pp();
            node.typeString = typeString;
            node.name = typeString;
        }
        this.commonVisit(node, ast);
    }
    visitIndexAccess(node, ast) {
        if (!(node.vIndexExpression &&
            (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference))[0] instanceof
                solc_typed_ast_1.FixedBytesType)) {
            this.visitExpression(node, ast);
            return;
        }
        const baseTypeName = (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference), ast);
        const width = baseTypeName.typeString.slice(5);
        const indexTypeName = node.vIndexExpression instanceof solc_typed_ast_1.Literal
            ? (0, nodeTemplates_1.createUint256TypeName)(ast)
            : (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vIndexExpression, ast.inference), ast);
        const stubParams = [
            ['base', baseTypeName],
            ['index', indexTypeName],
        ];
        const callArgs = [node.vBaseExpression, node.vIndexExpression];
        if (baseTypeName.typeString !== 'bytes32') {
            stubParams.push(['width', (0, nodeTemplates_1.createUint8TypeName)(ast)]);
            callArgs.push((0, nodeTemplates_1.createNumberLiteral)(width, ast, 'uint8'));
        }
        const importedFunc = ast.registerImport(node, [...importPaths_1.WARPLIB_MATHS, 'bytes_access'], selectWarplibFunction(baseTypeName, indexTypeName), stubParams, [['res', (0, nodeTemplates_1.createUint8TypeName)(ast)]]);
        const call = (0, functionGeneration_1.createCallToFunction)(importedFunc, callArgs, ast);
        ast.replaceNode(node, call, node.parent);
        const typeNode = replaceBytesType((0, nodeTypeProcessing_1.safeGetNodeType)(call, ast.inference));
        call.typeString = (0, getTypeString_1.generateExpressionTypeString)(typeNode);
        this.commonVisit(call, ast);
    }
    visitTypeName(node, ast) {
        const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        const replacementTypeNode = replaceBytesType(typeNode);
        if (typeNode.pp() !== replacementTypeNode.pp()) {
            const typeString = replacementTypeNode.pp();
            node.typeString = typeString;
        }
        this.commonVisit(node, ast);
    }
}
exports.BytesConverter = BytesConverter;
function replaceBytesType(type) {
    if (type instanceof solc_typed_ast_1.ArrayType) {
        return new solc_typed_ast_1.ArrayType(replaceBytesType(type.elementT), type.size, type.src);
    }
    else if (type instanceof solc_typed_ast_1.FixedBytesType) {
        return new solc_typed_ast_1.IntType(type.size * 8, false, type.src);
    }
    else if (type instanceof solc_typed_ast_1.FunctionType) {
        return new solc_typed_ast_1.FunctionType(type.name, type.parameters.map(replaceBytesType), type.returns.map(replaceBytesType), type.visibility, type.mutability, type.implicitFirstArg, type.src);
    }
    else if (type instanceof solc_typed_ast_1.MappingType) {
        return new solc_typed_ast_1.MappingType(replaceBytesType(type.keyType), replaceBytesType(type.valueType), type.src);
    }
    else if (type instanceof solc_typed_ast_1.PointerType) {
        return new solc_typed_ast_1.PointerType(replaceBytesType(type.to), type.location, type.kind, type.src);
    }
    else if (type instanceof solc_typed_ast_1.TupleType) {
        return new solc_typed_ast_1.TupleType(type.elements.map(replaceBytesType), type.src);
    }
    else if (type instanceof solc_typed_ast_1.TypeNameType) {
        return new solc_typed_ast_1.TypeNameType(replaceBytesType(type.type), type.src);
    }
    else if (type instanceof solc_typed_ast_1.BytesType) {
        return new solc_typed_ast_1.ArrayType(new solc_typed_ast_1.IntType(8, false, type.src), undefined, type.src);
    }
    else if (type instanceof solc_typed_ast_1.StringType) {
        return new solc_typed_ast_1.ArrayType(new solc_typed_ast_1.IntType(8, false, type.src), undefined, type.src);
    }
    else {
        return type;
    }
}
function selectWarplibFunction(baseTypeName, indexTypeName) {
    if (indexTypeName.typeString === 'uint256' && baseTypeName.typeString === 'bytes32') {
        return 'byte256_at_index_uint256';
    }
    if (indexTypeName.typeString === 'uint256') {
        return 'byte_at_index_uint256';
    }
    if (baseTypeName.typeString === 'bytes32') {
        return 'byte256_at_index';
    }
    return 'byte_at_index';
}
//# sourceMappingURL=bytesConverter.js.map