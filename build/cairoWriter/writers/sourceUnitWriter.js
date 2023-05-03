"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceUnitWriter = exports.structRemappings = exports.interfaceNameMappings = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const formatting_1 = require("../../utils/formatting");
const nameModifiers_1 = require("../../utils/nameModifiers");
const base_1 = require("../base");
// Used by:
//  -> CairoContractWriter
//  -> FunctionCallWriter
exports.interfaceNameMappings = new Map();
class SourceUnitWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        this.generateInterfaceNameMappings(node);
        // Every sourceUnit should only define a single contract
        const mainContract_ = node.vContracts.length >= 2
            ? node.vContracts.filter((cd) => !cd.name.endsWith(nameModifiers_1.TEMP_INTERFACE_SUFFIX))
            : node.vContracts;
        (0, assert_1.default)(mainContract_.length <= 1, 'Every SourceUnit should only define a single contract');
        exports.structRemappings = new Map();
        const contracts = node.vContracts.map((v) => writer.write(v));
        return [(0, formatting_1.removeExcessNewlines)([...contracts].join('\n\n\n'), 3)];
    }
    generateInterfaceNameMappings(node) {
        const map = new Map();
        const existingNames = node.vContracts
            .filter((c) => c.kind !== solc_typed_ast_1.ContractKind.Interface)
            .map((c) => c.name);
        node.vContracts
            .filter((c) => c.kind === solc_typed_ast_1.ContractKind.Interface && c.name.endsWith(nameModifiers_1.TEMP_INTERFACE_SUFFIX))
            .forEach((c) => {
            const baseName = c.name.replace(nameModifiers_1.TEMP_INTERFACE_SUFFIX, '');
            const interfaceName = `${baseName}_warped_interface`;
            if (!existingNames.includes(baseName)) {
                map.set(baseName, interfaceName);
            }
            else {
                let i = 1;
                while (existingNames.includes(`${interfaceName}_${i}`))
                    ++i;
                map.set(baseName, `${interfaceName}_${i}`);
            }
        });
        exports.interfaceNameMappings.set(node, map);
    }
}
exports.SourceUnitWriter = SourceUnitWriter;
//# sourceMappingURL=sourceUnitWriter.js.map