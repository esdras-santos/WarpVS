"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixFnCallRef = void 0;
const mapper_1 = require("../../ast/mapper");
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../../utils/errors");
class FixFnCallRef extends mapper_1.ASTMapper {
    constructor(getterFunctions) {
        super();
        this.getterFunctions = getterFunctions;
    }
    visitFunctionCall(node, ast) {
        if (node.vReferencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration) {
            if (node.vReferencedDeclaration.stateVariable &&
                node.vReferencedDeclaration.visibility === 'public') {
                /*
                  Getter function of a public state variable can be
                  only invoked through using this.`functionName` only
                */
                if (!(node.vExpression instanceof solc_typed_ast_1.MemberAccess)) {
                    throw new errors_1.TranspileFailedError('FixFnCallRef: vExpression is not a MemberAccess');
                }
                //assert getterFunctions has this variable
                const getterFunction = this.getterFunctions.get(node.vReferencedDeclaration);
                if (!getterFunction) {
                    throw new errors_1.TranspileFailedError(`FixFnCallRef: getter function for a public state variable not found`);
                }
                node.vExpression.vReferencedDeclaration = getterFunction;
            }
        }
        return this.visitExpression(node, ast);
    }
}
exports.FixFnCallRef = FixFnCallRef;
//# sourceMappingURL=fixFnCallRef.js.map