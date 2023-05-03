"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationStatementWriter = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../../utils/errors");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const utils_2 = require("../utils");
class VariableDeclarationStatementWriter extends base_1.CairoASTNodeWriter {
    constructor() {
        super(...arguments);
        this.gapVarCounter = 0;
    }
    writeInner(node, writer) {
        (0, assert_1.default)(node.vInitialValue !== undefined, 'Variables should be initialised. Did you use VariableDeclarationInitialiser?');
        const documentation = (0, utils_2.getDocumentation)(node.documentation, writer);
        const initialValueType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vInitialValue, this.ast.inference);
        const assertUnc = `assert(overflow == false, 'Overflow in unchecked block');`;
        let isUnc256 = false;
        let isUnc = false;
        if (node.vInitialValue instanceof solc_typed_ast_1.FunctionCall) {
            if (node.vInitialValue.vExpression instanceof solc_typed_ast_1.Identifier) {
                const funcName = writer.write(node.vInitialValue);
                if (funcName.includes('_overflow_') || funcName.includes('_overflowing_')) {
                    isUnc = true;
                    if (initialValueType.nBits === 256) {
                        isUnc256 = true;
                    }
                }
            }
        }
        const matchBlock = (decl) => {
            return [
                `    Result::Ok(${decl}) => (${decl}, false),`,
                `    Result::Err(${decl}) => (${decl}, true),`,
                `}`,
            ].join('\n');
        };
        const getValueN = (n) => {
            if (initialValueType instanceof solc_typed_ast_1.TupleType) {
                return initialValueType.elements[n];
            }
            else if (n === 0)
                return initialValueType;
            throw new errors_1.TranspileFailedError(`Attempted to extract value at index ${n} of non-tuple return`);
        };
        const getDeclarationForId = (id) => {
            const declaration = node.vDeclarations.find((decl) => decl.id === id);
            (0, assert_1.default)(declaration !== undefined, `Unable to find variable declaration for assignment ${id}`);
            return declaration;
        };
        const declarations = node.assignments.flatMap((id, index) => {
            const type = (0, solc_typed_ast_1.generalizeType)(getValueN(index))[0];
            if ((0, nodeTypeProcessing_1.isDynamicArray)(type) &&
                node.vInitialValue instanceof solc_typed_ast_1.FunctionCall &&
                (0, utils_1.isExternalCall)(node.vInitialValue)) {
                if (id === null) {
                    const uniqueSuffix = this.gapVarCounter++;
                    return [`__warp_gv_len${uniqueSuffix}`, `__warp_gv${uniqueSuffix}`];
                }
                const declaration = getDeclarationForId(id);
                (0, assert_1.default)(declaration.storageLocation === solc_typed_ast_1.DataLocation.CallData, `WARNING: declaration receiving calldata dynarray has location ${declaration.storageLocation}`);
                const writtenVar = writer.write(declaration);
                return [`${writtenVar}_len`, writtenVar];
            }
            else {
                if (id === null) {
                    return [`__warp_gv${this.gapVarCounter++}`];
                }
                const decl = [writer.write(getDeclarationForId(id))];
                if (isUnc) {
                    decl.push('overflow');
                }
                return decl;
            }
        });
        if (declarations.length > 1) {
            return [
                [
                    documentation,
                    `let (${declarations.join(', ')}) = ${isUnc && !isUnc256 ? 'match ' : ''}${writer.write(node.vInitialValue)}${isUnc && !isUnc256 ? `{\n${matchBlock(declarations[0])}` : ''};`,
                    isUnc ? assertUnc : '',
                ].join('\n'),
            ];
        }
        return [
            [documentation, `let ${declarations[0]} = ${writer.write(node.vInitialValue)};`].join('\n'),
        ];
    }
}
exports.VariableDeclarationStatementWriter = VariableDeclarationStatementWriter;
//# sourceMappingURL=variableDeclarationStatementWriter.js.map