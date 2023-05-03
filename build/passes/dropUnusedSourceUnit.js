"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropUnusedSourceUnits = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const export_1 = require("../export");
class DropUnusedSourceUnits extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        // Drop all source units which don't contain a deployable contract.
        ast.roots = ast.roots.filter((su) => su.vContracts.length > 0 &&
            su.vContracts.some((cd) => (cd.kind === solc_typed_ast_1.ContractKind.Contract && !cd.abstract) ||
                (cd.kind === solc_typed_ast_1.ContractKind.Interface && !cd.name.endsWith(export_1.TEMP_INTERFACE_SUFFIX))));
        return ast;
    }
}
exports.DropUnusedSourceUnits = DropUnusedSourceUnits;
//# sourceMappingURL=dropUnusedSourceUnit.js.map