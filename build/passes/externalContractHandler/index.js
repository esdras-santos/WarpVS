"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalContractHandler = void 0;
const mapper_1 = require("../../ast/mapper");
const externalContractInterfaceInserter_1 = require("./externalContractInterfaceInserter");
/*
  This is a compound pass which internally calls ExternalContractInterfaceInserter pass
  to insert interfaces for the external contracts that has been referenced into the AST
  for every SourceUnit.
  
  Simple importing contracts (namespaces in cairo) would not work because the constructors
  will conflict with the ones in the imported contracts.

  In order to call this contract from another contract, there is need to define an interface by
  copying the declarations of the external functions:
  for more info see: https://www.cairo-lang.org/docs/hello_starknet/calling_contracts.html
*/
class ExternalContractHandler extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'Ii',
            'Sa', // All contracts are changed to Cairo Contracts, and this passes uses the CairoContract class
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            const contractInterfaces = new Map();
            new externalContractInterfaceInserter_1.ExternalContractInterfaceInserter(contractInterfaces).dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.ExternalContractHandler = ExternalContractHandler;
//# sourceMappingURL=index.js.map