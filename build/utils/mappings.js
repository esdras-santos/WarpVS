"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMappingTypes = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
function getMappingTypes(v) {
    const isMapping = v.valueType instanceof solc_typed_ast_1.MappingType;
    return [v.keyType, ...(isMapping ? getMappingTypes(v.valueType) : [v.valueType])];
}
exports.getMappingTypes = getMappingTypes;
//# sourceMappingURL=mappings.js.map