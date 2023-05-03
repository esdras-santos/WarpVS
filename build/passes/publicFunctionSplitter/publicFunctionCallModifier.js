"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicFunctionCallModifier = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
class PublicFunctionCallModifier extends mapper_1.ASTMapper {
    constructor(internalToExternalFunctionMap) {
        super();
        this.internalToExternalFunctionMap = internalToExternalFunctionMap;
    }
    /*
    This class visits FunctionCalls and if they are:
      External function calls, they will be re-pointed to the external function definition created in the previous sub-pass.
      Internal function calls, they will still point to their old function definition, but will need to have their names
      changed to have the '_internal' suffix.
    */
    visitFunctionCall(node, ast) {
        const funcDef = node.vReferencedDeclaration;
        if (node.kind === solc_typed_ast_1.FunctionCallKind.FunctionCall &&
            funcDef instanceof solc_typed_ast_1.FunctionDefinition &&
            (node.vExpression instanceof solc_typed_ast_1.MemberAccess || node.vExpression instanceof solc_typed_ast_1.Identifier)) {
            const replacementFunction = this.internalToExternalFunctionMap.get(funcDef);
            // If replacementFunction exists then the FunctionCall pointed to a public function definition.
            // The function call will need to be modified irrespective of whether it is internal or external.
            if (replacementFunction !== undefined) {
                // If it is an external call the function gets re-pointed to the new external call.
                if ((0, solc_typed_ast_1.isFunctionCallExternal)(node)) {
                    node.vExpression.referencedDeclaration = replacementFunction.id;
                    // If it is an internal call then the functionCall.vExpressions name needs to be changed to
                    // match it's modified function definition's name
                }
                else {
                    const modifiedFuncName = funcDef.name;
                    node.vExpression instanceof solc_typed_ast_1.Identifier
                        ? (node.vExpression.name = modifiedFuncName)
                        : (node.vExpression.memberName = modifiedFuncName);
                }
            }
        }
        this.commonVisit(node, ast);
    }
}
exports.PublicFunctionCallModifier = PublicFunctionCallModifier;
//# sourceMappingURL=publicFunctionCallModifier.js.map