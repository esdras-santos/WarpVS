"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoContract = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
/*
 A version of ContractDefinition annotated with the information required
 to allocate the required space for storage variables
*/
class CairoContract extends solc_typed_ast_1.ContractDefinition {
    constructor(id, src, name, scope, kind, abstract, fullyImplemented, linearizedBaseContracts, usedErrors, dynamicStorageAllocations, staticStorageAllocations, usedStorage, usedStoredPointerIds, documentation, children, nameLocation, raw) {
        super(id, src, name, scope, kind, abstract, fullyImplemented, linearizedBaseContracts, usedErrors, documentation, children, nameLocation, raw);
        this.dynamicStorageAllocations = dynamicStorageAllocations;
        this.staticStorageAllocations = staticStorageAllocations;
        this.usedStorage = usedStorage;
        this.usedIds = usedStoredPointerIds;
        this.acceptChildren();
    }
}
exports.CairoContract = CairoContract;
//# sourceMappingURL=cairoContract.js.map