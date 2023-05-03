"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionTypeStringMatcher = void 0;
const mapper_1 = require("../ast/mapper");
const solc_typed_ast_1 = require("solc-typed-ast");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const getTypeString_1 = require("../utils/getTypeString");
class FunctionTypeStringMatcher extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionCall(node, ast) {
        const funcType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        if (node.vArguments.length === 0 ||
            node.kind === solc_typed_ast_1.FunctionCallKind.TypeConversion ||
            node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin ||
            !(node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition) ||
            !(funcType instanceof solc_typed_ast_1.FunctionType)) {
            this.commonVisit(node, ast);
            return;
        }
        const inputTypes = node.vReferencedDeclaration.vParameters.vParameters.map((varDecl) => {
            const type = (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, ast.inference);
            return (0, nodeTypeProcessing_1.isReferenceType)(type) ? (0, nodeTypeProcessing_1.specializeType)(type, varDecl.storageLocation) : type;
        });
        const outputTypes = node.vReferencedDeclaration.vReturnParameters.vParameters.map((varDecl) => {
            const type = (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, ast.inference);
            return (0, nodeTypeProcessing_1.isReferenceType)(type) ? (0, nodeTypeProcessing_1.specializeType)(type, varDecl.storageLocation) : type;
        });
        const newFuncType = new solc_typed_ast_1.FunctionType(funcType.name, inputTypes, outputTypes, funcType.visibility, funcType.mutability, funcType.implicitFirstArg, funcType.src);
        const funcTypeString = (0, getTypeString_1.generateExpressionTypeString)(newFuncType);
        node.vExpression.typeString = funcTypeString;
    }
}
exports.FunctionTypeStringMatcher = FunctionTypeStringMatcher;
//# sourceMappingURL=functionTypeStringMatcher.js.map