"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarnSupportedFeatures = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const formatting_1 = require("../utils/formatting");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
class WarnSupportedFeatures extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.addressesToAbiEncode = [];
        this.deploySaltOptions = [];
    }
    visitNewExpression(node, ast) {
        if (node.vTypeName instanceof solc_typed_ast_1.UserDefinedTypeName &&
            node.vTypeName.vReferencedDeclaration instanceof solc_typed_ast_1.ContractDefinition &&
            node.parent instanceof solc_typed_ast_1.FunctionCallOptions) {
            const salt = node.parent.vOptionsMap.get('salt');
            (0, assert_1.default)(salt !== undefined);
            this.deploySaltOptions.push(salt);
        }
        this.commonVisit(node, ast);
    }
    visitFunctionCall(node, ast) {
        if (node.kind === solc_typed_ast_1.FunctionCallKind.FunctionCall &&
            node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin &&
            ['encodePacked'].includes(node.vFunctionName)) {
            node.vArguments
                .filter((arg) => (0, nodeTypeProcessing_1.safeGetNodeType)(arg, ast.inference) instanceof solc_typed_ast_1.AddressType)
                .forEach((arg) => this.addressesToAbiEncode.push(arg));
        }
        this.commonVisit(node, ast);
    }
    static map(ast) {
        const addresses = new Map();
        const deploySalts = new Map();
        ast.roots.forEach((sourceUnit) => {
            const mapper = new this();
            mapper.dispatchVisit(sourceUnit, ast);
            if (mapper.addressesToAbiEncode.length > 0) {
                addresses.set(sourceUnit.absolutePath, mapper.addressesToAbiEncode);
            }
            if (mapper.deploySaltOptions.length > 0) {
                deploySalts.set(sourceUnit.absolutePath, mapper.deploySaltOptions);
            }
        });
        if (addresses.size > 0) {
            console.log(`${(0, formatting_1.warning)('Warning:')} ABI Packed encoding of address is 32 bytes long on warped contract (instead of 20 bytes).`);
            [...addresses.entries()].forEach(([path, nodes]) => warn(path, nodes));
        }
        if (deploySalts.size > 0) {
            console.log(`${(0, formatting_1.warning)('Warning')}: Due to Starknet restrictions, salt used for contract creation is narrowed from 'uint256' to 'felt' taking the first 248 most significant bits`);
            [...deploySalts.entries()].forEach(([path, nodes]) => warn(path, nodes));
        }
        return ast;
    }
}
exports.WarnSupportedFeatures = WarnSupportedFeatures;
function warn(path, nodes) {
    const content = fs_1.default.readFileSync(path, { encoding: 'utf-8' });
    const extendedMessage = [
        `File ${path}:`,
        ...(0, utils_1.getSourceFromLocations)(content, nodes.map((n) => (0, solc_typed_ast_1.parseSourceLocation)(n.src)), formatting_1.warning, 8)
            .split('\n')
            .map((l) => `\t${l}`),
    ].join('\n');
    console.log(extendedMessage + '\n');
}
//# sourceMappingURL=warnSupportedFeatures.js.map