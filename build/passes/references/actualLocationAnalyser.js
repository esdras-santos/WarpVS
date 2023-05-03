"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActualLocationAnalyser = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
/*
  Analyses all expressions in the AST to determine which datalocation (if any)
  they refer to. It's useful to do this as its own pass because there are edge cases
  not caught by a simple getNodeType (e.g. scalar storage variables)
*/
class ActualLocationAnalyser extends mapper_1.ASTMapper {
    constructor(actualLocations) {
        super();
        this.actualLocations = actualLocations;
    }
    visitExpression(node, ast) {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (type instanceof solc_typed_ast_1.PointerType) {
            this.actualLocations.set(node, type.location);
        }
        else if (type instanceof solc_typed_ast_1.TupleType) {
            this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Memory);
        }
        else {
            this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Default);
        }
        this.commonVisit(node, ast);
    }
    visitIdentifier(node, ast) {
        // Storage var identifiers can be of scalar types, so would not be picked up
        // by the PointerType check
        if (node.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration &&
            node.vReferencedDeclaration.stateVariable) {
            this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Storage);
            this.commonVisit(node, ast);
        }
        else {
            this.visitExpression(node, ast);
        }
    }
    visitMemberAccess(node, ast) {
        // Recurse first to analyse the base expression
        this.visitExpression(node, ast);
        // Checking this afterwards ensures that a memory struct inside a storage struct
        // is marked as being in storage
        const baseLocation = this.actualLocations.get(node.vExpression);
        if (baseLocation !== undefined) {
            const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
            if (baseType instanceof solc_typed_ast_1.FixedBytesType) {
                this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Default);
            }
            else {
                this.actualLocations.set(node, baseLocation);
            }
        }
    }
    visitIndexAccess(node, ast) {
        // Works on the same principle as visitMemberAccess
        this.visitExpression(node, ast);
        const baseLocation = this.actualLocations.get(node.vBaseExpression);
        if (baseLocation !== undefined) {
            const baseType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference);
            if (baseType instanceof solc_typed_ast_1.FixedBytesType) {
                this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Default);
            }
            else {
                this.actualLocations.set(node, baseLocation);
            }
        }
    }
    visitFunctionCall(node, ast) {
        if (node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin &&
            node.vFunctionName === 'push' &&
            node.vArguments.length === 0) {
            this.actualLocations.set(node, solc_typed_ast_1.DataLocation.Storage);
            this.commonVisit(node, ast);
        }
        else if (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition &&
            node.vReferencedDeclaration.visibility === solc_typed_ast_1.FunctionVisibility.External &&
            (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference) instanceof solc_typed_ast_1.PointerType) {
            this.actualLocations.set(node, solc_typed_ast_1.DataLocation.CallData);
            this.commonVisit(node, ast);
        }
        else {
            this.visitExpression(node, ast);
        }
    }
}
exports.ActualLocationAnalyser = ActualLocationAnalyser;
//# sourceMappingURL=actualLocationAnalyser.js.map