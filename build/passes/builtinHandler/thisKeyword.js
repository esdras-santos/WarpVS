"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThisKeyword = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const cairoNodes_1 = require("../../ast/cairoNodes");
const utils_1 = require("../../utils/utils");
const externalContractInterfaceInserter_1 = require("../externalContractHandler/externalContractInterfaceInserter");
const console_1 = require("console");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
class ThisKeyword extends mapper_1.ASTMapper {
    visitIdentifier(node, ast) {
        if (node.name === 'this') {
            const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ...importPaths_1.GET_CONTRACT_ADDRESS, [], [['address', (0, utils_1.typeNameFromTypeNode)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference), ast)]]), [], ast);
            ast.replaceNode(node, replacementCall);
        }
        else {
            return;
        }
    }
    visitFunctionCall(node, ast) {
        if (node.vExpression instanceof solc_typed_ast_1.MemberAccess &&
            node.vExpression.vExpression instanceof solc_typed_ast_1.Identifier &&
            node.vExpression.vExpression.name === 'this') {
            const currentContract = node.getClosestParentByType(solc_typed_ast_1.ContractDefinition);
            const sourceUnit = node.getClosestParentByType(solc_typed_ast_1.SourceUnit);
            if (currentContract && sourceUnit) {
                // check if the interface has already been added
                const contractIndex = sourceUnit.vContracts.findIndex((contract) => contract.name === (0, externalContractInterfaceInserter_1.getTemporaryInterfaceName)(currentContract.name));
                if (contractIndex === -1) {
                    const insertedInterface = (0, externalContractInterfaceInserter_1.genContractInterface)(currentContract, sourceUnit, ast);
                    replaceInterfaceWithCairoContract(insertedInterface, ast);
                }
            }
        }
        this.commonVisit(node, ast);
    }
}
exports.ThisKeyword = ThisKeyword;
function replaceInterfaceWithCairoContract(node, ast) {
    (0, console_1.assert)(node.kind === solc_typed_ast_1.ContractKind.Interface);
    const replacement = new cairoNodes_1.CairoContract(node.id, node.src, node.name, node.scope, node.kind, node.abstract, node.fullyImplemented, node.linearizedBaseContracts, node.usedErrors, new Map(), new Map(), 0, 0, node.documentation, [...node.children], node.nameLocation, node.raw);
    ast.replaceNode(node, replacement);
}
//# sourceMappingURL=thisKeyword.js.map