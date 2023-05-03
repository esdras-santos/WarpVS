"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InaccessibleDynamicType = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
/**
 * Place-holder type used only by the typestring parser for
 * cases when the typestring contains "inaccessible dynamic type".
 */
class InaccessibleDynamicType extends solc_typed_ast_1.TypeNode {
    pp() {
        return 'inaccessible_dynamic_type';
    }
}
exports.InaccessibleDynamicType = InaccessibleDynamicType;
//# sourceMappingURL=inaccessibleDynamicType.js.map