"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalFunctionCreator = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const cloning_1 = require("../../utils/cloning");
const errors_1 = require("../../utils/errors");
const nameModifiers_1 = require("../../utils/nameModifiers");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const getTypeString_1 = require("../../utils/getTypeString");
class ExternalFunctionCreator extends mapper_1.ASTMapper {
    constructor(internalToExternalFunctionMap, internalFunctionCallSet) {
        super();
        this.internalToExternalFunctionMap = internalToExternalFunctionMap;
        this.internalFunctionCallSet = internalFunctionCallSet;
    }
    /*
    This class will visit each function definition. If the function definition is public it will
    create an external counterpart. The visited function will then be changed to internal and have
    the suffix _internal added to the name.
  
    The internal and external functions will be added to the Maps above to be used in the next pass
    to modify the function calls. All internal function calls to the original function will need to
    be renamed and all contract to contract calls need to have their referenced changed to the external
    function (Still not supported yet).
    */
    visitFunctionDefinition(node, ast) {
        if (node.vScope instanceof solc_typed_ast_1.ContractDefinition && node.vScope.kind === solc_typed_ast_1.ContractKind.Interface) {
            return;
        }
        if (solc_typed_ast_1.FunctionVisibility.Public === node.visibility && node.kind !== solc_typed_ast_1.FunctionKind.Constructor) {
            if (this.internalFunctionCallSet.has(node)) {
                const newExternalFunction = this.createExternalFunctionDefinition(node, ast);
                this.insertReturnStatement(node, newExternalFunction, ast);
                this.modifyPublicFunction(node);
                this.internalToExternalFunctionMap.set(node, newExternalFunction);
            }
            else {
                node.visibility = solc_typed_ast_1.FunctionVisibility.External;
            }
        }
        this.commonVisit(node, ast);
    }
    modifyPublicFunction(node) {
        node.visibility = solc_typed_ast_1.FunctionVisibility.Internal;
        node.name = `${node.name}${nameModifiers_1.INTERNAL_FUNCTION_SUFFIX}`;
    }
    createExternalFunctionDefinition(node, ast) {
        const newBlock = (0, nodeTemplates_1.createBlock)([], ast);
        const internalFunctionBody = node.vBody;
        node.vBody = undefined;
        const externalFunction = (0, cloning_1.cloneASTNode)(node, ast);
        externalFunction.vBody = newBlock;
        externalFunction.acceptChildren();
        externalFunction.visibility = solc_typed_ast_1.FunctionVisibility.External;
        node.vBody = internalFunctionBody;
        return externalFunction;
    }
    insertReturnStatement(node, externalFunction, ast) {
        const internalFunctionCallArguments = externalFunction.vParameters.vParameters.map((parameter) => {
            return (0, nodeTemplates_1.createIdentifier)(parameter, ast, undefined, node);
        });
        const internalFunctionCall = createCallToInternalFunction(node, internalFunctionCallArguments, ast);
        const newReturnFunctionCall = (0, nodeTemplates_1.createReturn)(internalFunctionCall, externalFunction.vReturnParameters.id, ast);
        externalFunction.vBody?.appendChild(newReturnFunctionCall);
        node.getClosestParentByType(solc_typed_ast_1.ContractDefinition)?.appendChild(externalFunction);
        ast.setContextRecursive(externalFunction);
    }
}
exports.ExternalFunctionCreator = ExternalFunctionCreator;
function createCallToInternalFunction(functionDef, argList, ast, nodeInSourceUnit) {
    const contract = functionDef.getClosestParentByType(solc_typed_ast_1.ContractDefinition);
    if (contract === undefined) {
        throw new errors_1.TranspilationAbandonedError(`Function ${functionDef.name} is not a member of any contract`);
    }
    const functionIdentifier = new solc_typed_ast_1.Identifier(ast.reserveId(), '', (0, getTypeString_1.getFunctionTypeString)(functionDef, ast.inference, nodeInSourceUnit), functionDef.name, functionDef.id);
    return new solc_typed_ast_1.FunctionCall(ast.reserveId(), '', (0, getTypeString_1.getReturnTypeString)(functionDef, ast, nodeInSourceUnit), solc_typed_ast_1.FunctionCallKind.FunctionCall, functionIdentifier, argList);
}
//# sourceMappingURL=externalFunctionCreator.js.map