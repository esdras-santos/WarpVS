"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoFunctionDefinitionWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const astPrinter_1 = require("../../utils/astPrinter");
const formatting_1 = require("../../utils/formatting");
const typeConstructs_1 = require("../../utils/typeConstructs");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const utils_2 = require("../utils");
const endent_1 = __importDefault(require("endent"));
class CairoFunctionDefinitionWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, writer) {
        if (node.functionStubKind !== cairoNodes_1.FunctionStubKind.None)
            return [''];
        const documentation = (0, utils_2.getDocumentation)(node.documentation, writer);
        if (documentation.slice(2).trim().startsWith('warp-cairo')) {
            return [
                documentation
                    .split('\n')
                    .map((line) => line.slice(2).trim())
                    .slice(1)
                    .join('\n'),
            ];
        }
        const name = this.getName(node);
        const decorator = this.getDecorator(node);
        const args = node.kind !== solc_typed_ast_1.FunctionKind.Fallback
            ? writer.write(node.vParameters)
            : 'selector : felt, calldata_size : felt, calldata : felt*';
        const body = this.getBody(node, writer);
        const returns = this.getReturns(node, writer);
        return [
            [documentation, ...decorator, `fn ${name}(${args})${returns}{`, body, `}`]
                .filter(typeConstructs_1.notNull)
                .join('\n'),
        ];
    }
    getDecorator(node) {
        if (node.kind === solc_typed_ast_1.FunctionKind.Constructor)
            return ['#[constructor]'];
        const decorators = [];
        if (node.kind === solc_typed_ast_1.FunctionKind.Fallback) {
            decorators.push('#[raw_input]');
            if (node.vParameters.vParameters.length > 0)
                decorators.push('#[raw_output]');
        }
        if (node.visibility === solc_typed_ast_1.FunctionVisibility.External) {
            if ([solc_typed_ast_1.FunctionStateMutability.Pure, solc_typed_ast_1.FunctionStateMutability.View].includes(node.stateMutability))
                decorators.push('#[view]');
            else
                decorators.push('#[external]');
        }
        if (node.implicits.has('warp_memory')) {
            decorators.push('#[implicit(warp_memory)]');
        }
        return decorators;
    }
    getName(node) {
        if (node.kind === solc_typed_ast_1.FunctionKind.Constructor)
            return 'constructor';
        if (node.kind === solc_typed_ast_1.FunctionKind.Fallback)
            return '__default__';
        return node.name;
    }
    getBody(node, writer) {
        if (node.vBody === undefined)
            return null;
        if (!(0, utils_1.isExternallyVisible)(node) || !node.implicits.has('warp_memory')) {
            return [this.getConstructorStorageAllocation(node), writer.write(node.vBody)]
                .filter(typeConstructs_1.notNull)
                .join('\n');
        }
        (0, assert_1.default)(node.vBody.children.length > 0, (0, formatting_1.error)(`${(0, astPrinter_1.printNode)(node)} has an empty body`));
        return [
            this.getConstructorStorageAllocation(node),
            (0, endent_1.default) `let mut warp_memory: WarpMemory = MemoryTrait::initialize();
      ${writer.write(node.vBody)}
      `,
        ]
            .flat()
            .filter(typeConstructs_1.notNull)
            .join('\n');
    }
    getReturns(node, writer) {
        if (node.kind === solc_typed_ast_1.FunctionKind.Constructor)
            return '';
        const returnStr = writer.write(node.vReturnParameters);
        const paramLen = node.vReturnParameters.vParameters.length;
        // Cairo1 does not need to always return a tuple as former versions
        if (paramLen > 1)
            return `-> (${returnStr})`;
        else if (paramLen === 1)
            return `-> ${returnStr}`;
        else
            return ''; // No return specified so nothing to print
    }
    getConstructorStorageAllocation(node) {
        if (node.kind === solc_typed_ast_1.FunctionKind.Constructor) {
            const contract = node.vScope;
            (0, assert_1.default)(contract instanceof cairoNodes_1.CairoContract);
            if (contract.usedStorage === 0 && contract.usedIds === 0) {
                return null;
            }
            return [
                contract.usedStorage === 0 ? '' : `WARP_USED_STORAGE::write(${contract.usedStorage});`,
                contract.usedIds === 0 ? '' : `WARP_NAMEGEN::write(${contract.usedIds});`,
            ].join(`\n`);
        }
        return null;
    }
}
exports.CairoFunctionDefinitionWriter = CairoFunctionDefinitionWriter;
//# sourceMappingURL=cairoFunctionDefinitionWriter.js.map