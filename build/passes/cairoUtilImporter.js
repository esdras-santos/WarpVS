"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoUtilImporter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const importFuncGenerator_1 = require("../utils/importFuncGenerator");
const importPaths_1 = require("../utils/importPaths");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
/*
  Analyses the tree after all processing has been done to find code the relies on
  cairo imports that are not easy to add elsewhere. For example it's easy to import
  the warplib maths functions as they are added to the code, but for determining if
  Uint256 needs to be imported, it's easier to do it here
*/
class CairoUtilImporter extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitElementaryTypeName(node, ast) {
        const cairoType = (0, utils_1.primitiveTypeToCairo)(node.name);
        if (cairoType === 'u256') {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.U128_FROM_FELT, this.dummySourceUnit ?? node, ast);
        }
        else if (cairoType === 'ContractAddress') {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.CONTRACT_ADDRESS, this.dummySourceUnit ?? node, ast);
        }
    }
    visitLiteral(node, ast) {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (type instanceof solc_typed_ast_1.IntType && type.nBits > 251) {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.U256_FROM_FELTS, this.dummySourceUnit ?? node, ast);
        }
        if (type instanceof solc_typed_ast_1.AddressType) {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.CONTRACT_ADDRESS, this.dummySourceUnit ?? node, ast);
        }
    }
    visitVariableDeclaration(node, ast) {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (type instanceof solc_typed_ast_1.IntType && type.nBits > 251) {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.U128_FROM_FELT, this.dummySourceUnit ?? node, ast);
        }
        if (type instanceof solc_typed_ast_1.AddressType) {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.CONTRACT_ADDRESS, this.dummySourceUnit ?? node, ast);
        }
        //  Patch to struct inlining
        if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
            const currentSourceUnit = (0, utils_1.getContainingSourceUnit)(node);
            if (currentSourceUnit !== type.definition.getClosestParentByType(solc_typed_ast_1.SourceUnit)) {
                this.dummySourceUnit = this.dummySourceUnit ?? currentSourceUnit;
                type.definition.walkChildren((child) => this.commonVisit(child, ast));
                this.dummySourceUnit =
                    this.dummySourceUnit === currentSourceUnit ? undefined : this.dummySourceUnit;
            }
        }
        this.visitExpression(node, ast);
    }
    visitMemberAccess(node, ast) {
        if (node.memberName === 'into') {
            (0, importFuncGenerator_1.createImport)(...importPaths_1.INTO, node, ast);
        }
    }
}
exports.CairoUtilImporter = CairoUtilImporter;
//# sourceMappingURL=cairoUtilImporter.js.map