"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const export_1 = require("../../export");
const base_1 = require("../base");
const utils_1 = require("../utils");
const sourceUnitWriter_1 = require("./sourceUnitWriter");
class FunctionCallWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        const args = node.vArguments.map((v) => writer.write(v)).join(', ');
        const func = writer.write(node.vExpression);
        switch (node.kind) {
            case solc_typed_ast_1.FunctionCallKind.FunctionCall: {
                if (node.vExpression instanceof solc_typed_ast_1.MemberAccess) {
                    // check if we're calling a member of a contract
                    const nodeType = (0, export_1.safeGetNodeType)(node.vExpression.vExpression, this.ast.inference);
                    if (nodeType instanceof solc_typed_ast_1.UserDefinedType &&
                        nodeType.definition instanceof solc_typed_ast_1.ContractDefinition) {
                        let isDelegateCall = false;
                        const memberName = node.vExpression.memberName;
                        let firstArg = writer.write(node.vExpression.vExpression); // could be address or class_hash
                        const docLets = (0, utils_1.getDocumentation)(nodeType.definition.documentation, writer)
                            .split('\n')
                            .map((ele) => ele.slice(2).trim());
                        if (docLets[0] === 'WARP-GENERATED') {
                            // extract class hash from doclets[1] which is in the format "class_hash: 0x..."
                            const classHashTextLets = docLets[1].split(':').map((ele) => ele.trim());
                            if (classHashTextLets[0] !== 'class_hash') {
                                throw new export_1.TranspileFailedError('Class Hash not found in interface documentation');
                            }
                            isDelegateCall = true;
                            firstArg = classHashTextLets[1];
                        }
                        return [
                            `${(0, utils_1.getInterfaceNameForContract)(nodeType.definition.name, node, sourceUnitWriter_1.interfaceNameMappings)}.${(isDelegateCall ? 'library_call_' : '') + memberName}(${firstArg}${args ? ', ' : ''}${args})`,
                        ];
                    }
                }
                else if (node.vReferencedDeclaration instanceof cairoNodes_1.CairoGeneratedFunctionDefinition &&
                    node.vReferencedDeclaration.rawStringDefinition.includes('@storage_var')) {
                    return node.vArguments.length ===
                        node.vReferencedDeclaration.vParameters.vParameters.length
                        ? [`${func}.read(${args})`]
                        : [`${func}.write(${args})`];
                }
                else if (node.vReferencedDeclaration instanceof export_1.CairoFunctionDefinition &&
                    (node.vReferencedDeclaration.acceptsRawDarray ||
                        node.vReferencedDeclaration.acceptsUnpackedStructArray)) {
                    const [len_suffix, name_suffix] = node.vReferencedDeclaration.acceptsRawDarray
                        ? ['_len', '']
                        : ['.len', '.ptr'];
                    const argTypes = node.vArguments.map((v) => ({
                        name: writer.write(v),
                        type: (0, export_1.safeGetNodeType)(v, this.ast.inference),
                    }));
                    const args = argTypes
                        .map(({ name, type }) => (0, export_1.isDynamicArray)(type) ? `${name}${len_suffix}, ${name}${name_suffix}` : name)
                        .join(',');
                    return [`${func}(${args})`];
                }
                return [`${func}(${args})`];
            }
            case solc_typed_ast_1.FunctionCallKind.StructConstructorCall:
                return [
                    `${node.vReferencedDeclaration && node.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition
                        ? node.vReferencedDeclaration
                            ? (0, export_1.mangleStructName)(node.vReferencedDeclaration)
                            : func
                        : func}(${args})`,
                ];
            case solc_typed_ast_1.FunctionCallKind.TypeConversion: {
                const arg = node.vArguments[0];
                if (node.vFunctionName === 'address' && arg instanceof solc_typed_ast_1.Literal) {
                    const val = BigInt(arg.value);
                    // Make sure literal < 2**251
                    (0, assert_1.default)(val < BigInt('0x800000000000000000000000000000000000000000000000000000000000000'));
                    return [`${args[0]}`];
                }
                const nodeType = (0, export_1.safeGetNodeType)(node.vExpression, this.ast.inference);
                if (nodeType instanceof solc_typed_ast_1.UserDefinedType &&
                    nodeType.definition instanceof solc_typed_ast_1.ContractDefinition) {
                    return [`${args}`];
                }
                return [`${func}(${args})`];
            }
        }
    }
}
exports.FunctionCallWriter = FunctionCallWriter;
//# sourceMappingURL=functionCallWriter.js.map