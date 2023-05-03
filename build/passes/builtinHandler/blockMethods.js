"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMethods = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
/*
A subpass that replaces the block.timestamp and block.number methods.
In Solidity these functions return uint256, but in cairo these will return felts.
Therefore, we wrap the replacement functions in felt_to_uint256 warplib functions.
*/
class BlockMethods extends mapper_1.ASTMapper {
    visitExpression(node, ast) {
        this.commonVisit(node, ast);
    }
    visitMemberAccess(node, ast) {
        if (node.vExpression instanceof solc_typed_ast_1.Identifier &&
            node.vExpression.name === 'block' &&
            node.vExpression.vIdentifierType === solc_typed_ast_1.ExternalReferenceType.Builtin) {
            if (node.memberName === 'number') {
                const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ['warplib', 'block_methods'], 'warp_block_number', [], [['block_num', (0, nodeTemplates_1.createUint256TypeName)(ast)]]), [], ast);
                ast.replaceNode(node, replacementCall);
            }
            else if (node.memberName === 'timestamp') {
                const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ['warplib', 'block_methods'], 'warp_block_timestamp', [], [['block_timestamp', (0, nodeTemplates_1.createUint256TypeName)(ast)]]), [], ast);
                ast.replaceNode(node, replacementCall);
            }
        }
        else {
            this.visitExpression(node, ast);
        }
    }
}
exports.BlockMethods = BlockMethods;
//# sourceMappingURL=blockMethods.js.map