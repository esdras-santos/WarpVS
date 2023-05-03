"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaceIdentifierContractMemberAccess = void 0;
const mapper_1 = require("../ast/mapper");
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const utils_1 = require("../utils/utils");
const getTypeString_1 = require("../utils/getTypeString");
/**
 * This pass replaces all identifier whose referenced declaration defined outside of the function body,
 * by a member access with the expression as an identifier referenced to it's parent contract.
 * For e.g.
 *        contract A {
 *           uint public a;
 *           function f() public view {
 *              uint b = a;   // would be replace with A.a
 *              g();          // would be replaced with A.g()
 *           }
 *        }
 *     -- function f to be written outside of namespace A (see `cairoWriter.ts: 519`) --
 * This is done to separate the external functions outside of the namespace
 * so that there would be abi's generated for them. see `cairoWriter.ts: 519`.
 * from cairo v0.10.0, for the functions lying inside the cairo namespace , there would be
 * no abi generated for them.
 */
class ReplaceIdentifierContractMemberAccess extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'Sa', // Pass uses CairoFunctionDefinition and CairoContract
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitCairoFunctionDefinition(node, ast) {
        if ((0, utils_1.isExternallyVisible)(node)) {
            this.commonVisit(node, ast);
        }
    }
    visitIdentifier(node, ast) {
        const referencedDeclarationNode = ast.context.locate(node.referencedDeclaration);
        const functionParent = referencedDeclarationNode.getClosestParentByType(cairoNodes_1.CairoFunctionDefinition);
        const contractParent = referencedDeclarationNode.getClosestParentByType(cairoNodes_1.CairoContract);
        if (referencedDeclarationNode instanceof cairoNodes_1.CairoContract ||
            (contractParent instanceof cairoNodes_1.CairoContract && contractParent.kind !== solc_typed_ast_1.ContractKind.Contract)) {
            return;
        }
        if (functionParent === undefined && contractParent !== undefined) {
            const memberAccess = new solc_typed_ast_1.MemberAccess(ast.reserveId(), node.src, node.typeString, new solc_typed_ast_1.Identifier(ast.reserveId(), '', (0, getTypeString_1.getContractTypeString)(contractParent), contractParent.name, contractParent.id), node.name, referencedDeclarationNode.id);
            ast.replaceNode(node, memberAccess);
        }
    }
}
exports.ReplaceIdentifierContractMemberAccess = ReplaceIdentifierContractMemberAccess;
//# sourceMappingURL=replaceIdentifierContractMemberAccess.js.map