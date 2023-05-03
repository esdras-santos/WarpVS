"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ecrecover = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class Ecrecover extends mapper_1.ASTMapper {
    visitFunctionCall(node, ast) {
        if (!(node.vFunctionName === 'ecrecover' &&
            node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin)) {
            return this.commonVisit(node, ast);
        }
        const ecrecoverEth = ast.registerImport(node, ['warplib', 'ecrecover'], 'ecrecover_eth', [
            ['msg_hash', (0, nodeTemplates_1.createUintNTypeName)(256, ast)],
            ['v', (0, nodeTemplates_1.createUintNTypeName)(8, ast)],
            ['r', (0, nodeTemplates_1.createUintNTypeName)(256, ast)],
            ['s', (0, nodeTemplates_1.createUintNTypeName)(256, ast)],
        ], [['eth_address', (0, nodeTemplates_1.createUintNTypeName)(160, ast)]]);
        ast.replaceNode(node, (0, functionGeneration_1.createCallToFunction)(ecrecoverEth, node.vArguments, ast));
    }
}
exports.Ecrecover = Ecrecover;
//# sourceMappingURL=ecrecover.js.map