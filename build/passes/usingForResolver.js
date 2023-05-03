"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingForResolver = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
/*
  Solidity supports Library, function Definition inside UsingForDirectives:
  for.eg. a
    1.) list of file-level or library functions (using {f, g, h, L.t} for uint;)
    2.) he name of a library (using L for uint;) - all functions (both public and internal ones

  This pass will resolve the function call for given type that has been via `UsingForDirective`
  by visiting every MemberAccess Node inside the FunctionCall.

  For example, if we have:
      using {x} for uint; // x is a file-level function
      then a.x() will resolve to x(a)

  More details at: https://solidity.readthedocs.io/en/latest/usingfor.html
*/
class UsingForResolver extends mapper_1.ASTMapper {
    // No need to check whether certain library/functions/library-functions
    // are attached to a type, as they would be checked by solc-typed-ast
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        const memberAccessNode = node.vExpression;
        if (!(memberAccessNode instanceof solc_typed_ast_1.MemberAccess))
            return;
        const referencedFn = memberAccessNode.vReferencedDeclaration;
        if (!(referencedFn instanceof solc_typed_ast_1.FunctionDefinition))
            return;
        if (memberAccessNode.vExpression instanceof solc_typed_ast_1.Identifier &&
            memberAccessNode.vExpression.vReferencedDeclaration instanceof solc_typed_ast_1.ContractDefinition &&
            memberAccessNode.vExpression.vReferencedDeclaration.kind === solc_typed_ast_1.ContractKind.Library)
            return;
        const referencedFnScope = referencedFn.vScope;
        if (referencedFnScope instanceof solc_typed_ast_1.ContractDefinition) {
            const contract = referencedFnScope;
            if (contract.kind !== solc_typed_ast_1.ContractKind.Library)
                return;
            const libraryIdentifier = new solc_typed_ast_1.Identifier(ast.reserveId(), '', `type(library ${contract.name})`, contract.name, contract.id);
            node.vArguments.unshift(memberAccessNode.vExpression);
            ast.registerChild(memberAccessNode.vExpression, node);
            memberAccessNode.vExpression = libraryIdentifier;
            memberAccessNode.memberName = referencedFn.name;
            ast.registerChild(libraryIdentifier, memberAccessNode);
        }
        else if (referencedFnScope instanceof solc_typed_ast_1.SourceUnit) {
            const functionIdentifier = new solc_typed_ast_1.Identifier(ast.reserveId(), '', node.vExpression.typeString, referencedFn.name, referencedFn.id);
            node.vArguments.unshift(memberAccessNode.vExpression);
            ast.registerChild(memberAccessNode.vExpression, node);
            node.vExpression = functionIdentifier;
            ast.registerChild(functionIdentifier, node);
        }
    }
}
exports.UsingForResolver = UsingForResolver;
//# sourceMappingURL=usingForResolver.js.map