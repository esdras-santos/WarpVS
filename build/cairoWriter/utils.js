"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInterfaceNameForContract = exports.getDocumentation = exports.INCLUDE_CAIRO_DUMP_FUNCTIONS = exports.INDENT = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
exports.INDENT = ' '.repeat(4);
exports.INCLUDE_CAIRO_DUMP_FUNCTIONS = false;
function getDocumentation(documentation, writer) {
    return documentation !== undefined
        ? typeof documentation === 'string'
            ? `// ${documentation.split('\n').join('\n//')}`
            : writer.write(documentation)
        : '';
}
exports.getDocumentation = getDocumentation;
function getInterfaceNameForContract(contractName, nodeInSourceUnit, interfaceNameMappings) {
    const sourceUnit = nodeInSourceUnit instanceof solc_typed_ast_1.SourceUnit
        ? nodeInSourceUnit
        : nodeInSourceUnit.getClosestParentByType(solc_typed_ast_1.SourceUnit);
    (0, assert_1.default)(sourceUnit !== undefined, `Unable to find source unit for interface ${contractName} while writing`);
    const interfaceName = interfaceNameMappings.get(sourceUnit)?.get(contractName);
    (0, assert_1.default)(interfaceName !== undefined, `An error occurred during name substitution for the interface ${contractName}`);
    return interfaceName;
}
exports.getInterfaceNameForContract = getInterfaceNameForContract;
//# sourceMappingURL=utils.js.map