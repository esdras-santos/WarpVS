"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.References = void 0;
const mapper_1 = require("../../ast/mapper");
const actualLocationAnalyser_1 = require("./actualLocationAnalyser");
const arrayFunctions_1 = require("./arrayFunctions");
const dataAccessFunctionaliser_1 = require("./dataAccessFunctionaliser");
const delete_1 = require("./delete");
const expectedLocationAnalyser_1 = require("./expectedLocationAnalyser");
const externalReturnReceiver_1 = require("./externalReturnReceiver");
const memoryAllocations_1 = require("./memoryAllocations");
const stateVarRefFlattener_1 = require("./stateVarRefFlattener");
const storedPointerDereference_1 = require("./storedPointerDereference");
/*
  Solidity allows mutable references pointing to mutable data, and while cairo allows reference
  rebinding and pointers, they are not sufficient to for a naive transpilation. Instead, we utilise
  storage_vars for storage and a DictAccess for memory. Both contain data serialised into felts

  First we need to work out what data location each expression refers to. This is usually simple, but
  there are enough edge cases that it's worth separating

  Second, expressions that actually allocate data into memory are transformed into functions that modify
  the DictAccess and return the index of the start of the allocated data

  Third, array members push, pop, and length are transformed. Those calculable at compile time are replaced
  with literals, others become functions related to the respective data location

  Fourth, deletes referring to storage are replaced with functions that actually modify storage. For other
  data locations the normal way works fine, only for storage does delete actually change the underlying data

  Finally, variables referencing storage or memory are replaced with read or write functions as appropriate
*/
class References extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            const actualDataLocations = new Map();
            const expectedDataLocations = new Map();
            new stateVarRefFlattener_1.StateVarRefFlattener().dispatchVisit(root, ast);
            new externalReturnReceiver_1.ExternalReturnReceiver().dispatchVisit(root, ast);
            new actualLocationAnalyser_1.ActualLocationAnalyser(actualDataLocations).dispatchVisit(root, ast);
            new expectedLocationAnalyser_1.ExpectedLocationAnalyser(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
            new arrayFunctions_1.ArrayFunctions(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
            new memoryAllocations_1.MemoryAllocations(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
            new delete_1.StorageDelete(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
            new storedPointerDereference_1.StoredPointerDereference(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
            new dataAccessFunctionaliser_1.DataAccessFunctionaliser(actualDataLocations, expectedDataLocations).dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.References = References;
// import { printNode } from '../../utils/astPrinter';
// function printLocations(
//   actualDataLocations: Map<Expression, DataLocation>,
//   expectedDataLocations: Map<Expression, DataLocation>,
// ): void {
//   [...actualDataLocations.entries()].forEach(([expr, loc]) => {
//     console.log(
//       `${printNode(expr)}: actual - ${loc}, expected - ${expectedDataLocations.get(expr)}`,
//     );
//   });
// }
//# sourceMappingURL=index.js.map