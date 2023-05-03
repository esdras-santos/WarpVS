"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportDirectiveIdentifier = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
const getTypeString_1 = require("../utils/getTypeString");
// The pass handles specific imports for library, contract, interface,
// free functions, structs and enum.
//
// Working :
// For each identifier node of ImportDirective the pass adds typeString
// of referencedDeclaration Node. (The identifier nodes of ImportDirective
// do not have default typeString (current latest solc version - 0.8.13).
class ImportDirectiveIdentifier extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitImportDirective(node, ast) {
        node.getChildrenByType(solc_typed_ast_1.Identifier).forEach((identifier) => {
            (0, assert_1.default)(identifier.vReferencedDeclaration !== undefined);
            identifier.typeString = getTypestring(identifier.vReferencedDeclaration, ast);
        });
    }
}
exports.ImportDirectiveIdentifier = ImportDirectiveIdentifier;
function getTypestring(node, ast) {
    if (node instanceof solc_typed_ast_1.ContractDefinition) {
        return (0, getTypeString_1.getContractTypeString)(node);
    }
    if (node instanceof solc_typed_ast_1.FunctionDefinition) {
        return (0, getTypeString_1.getFunctionTypeString)(node, ast.inference);
    }
    if (node instanceof solc_typed_ast_1.StructDefinition) {
        return (0, getTypeString_1.getStructTypeString)(node);
    }
    if (node instanceof solc_typed_ast_1.EnumDefinition) {
        return (0, getTypeString_1.getEnumTypeString)(node);
    }
    throw new errors_1.NotSupportedYetError(`Importing ${node.type} not implemented yet`);
}
//# sourceMappingURL=importDirectiveIdentifier.js.map