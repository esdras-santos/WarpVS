"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Keccak = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
class Keccak extends mapper_1.ASTMapper {
    visitFunctionCall(node, ast) {
        if (!(node.vFunctionName === 'keccak256' &&
            node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin)) {
            return this.commonVisit(node, ast);
        }
        const warpKeccak = ast.registerImport(node, ...importPaths_1.WARP_KECCAK, [['input', (0, nodeTemplates_1.createArrayTypeName)((0, nodeTemplates_1.createUintNTypeName)(8, ast), ast), solc_typed_ast_1.DataLocation.Memory]], [['hash', (0, nodeTemplates_1.createBytesNTypeName)(32, ast)]]);
        ast.replaceNode(node, (0, functionGeneration_1.createCallToFunction)(warpKeccak, node.vArguments, ast));
        this.commonVisit(node, ast);
    }
}
exports.Keccak = Keccak;
//# sourceMappingURL=keccak.js.map