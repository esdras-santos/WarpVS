"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalFunctionCallCollector = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
class InternalFunctionCallCollector extends mapper_1.ASTMapper {
    /*
    This class collects all functions which are internal. This is used in later sub-passes to
    avoid splitting public functions with no internal calls. This produces cleaner Cairo code
    and lessens the step and line counts.
    
    All public Solidity functions which have no internal calls pointing to them will be modified
    to be external only functions.
    */
    constructor(internalFunctionCallSet) {
        super();
        this.internalFunctionCallSet = internalFunctionCallSet;
    }
    visitFunctionCall(node, ast) {
        const funcDef = node.vReferencedDeclaration;
        if (funcDef instanceof solc_typed_ast_1.FunctionDefinition) {
            if (node.vExpression instanceof solc_typed_ast_1.MemberAccess) {
                const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression.vExpression, ast.inference);
                if (typeNode instanceof solc_typed_ast_1.UserDefinedType &&
                    typeNode.definition instanceof solc_typed_ast_1.ContractDefinition) {
                    this.commonVisit(node, ast);
                    return;
                }
            }
            this.internalFunctionCallSet.add(funcDef);
        }
        this.commonVisit(node, ast);
    }
}
exports.InternalFunctionCallCollector = InternalFunctionCallCollector;
//# sourceMappingURL=internalFunctionCallCollector.js.map