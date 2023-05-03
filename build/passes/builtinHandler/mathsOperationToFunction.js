"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathsOperationToFunction = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const bitwiseAnd_1 = require("../../warplib/implementations/maths/bitwiseAnd");
const bitwiseNot_1 = require("../../warplib/implementations/maths/bitwiseNot");
const bitwiseOr_1 = require("../../warplib/implementations/maths/bitwiseOr");
const exp_1 = require("../../warplib/implementations/maths/exp");
const negate_1 = require("../../warplib/implementations/maths/negate");
const shl_1 = require("../../warplib/implementations/maths/shl");
const shr_1 = require("../../warplib/implementations/maths/shr");
const xor_1 = require("../../warplib/implementations/maths/xor");
const unckeckedMathUtils_1 = require("./utils/unckeckedMathUtils");
/* Note we also include mulmod and add mod here */
class MathsOperationToFunction extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.inUncheckedBlock = false;
    }
    visitUncheckedBlock(node, ast) {
        this.inUncheckedBlock = true;
        this.commonVisit(node, ast);
        this.inUncheckedBlock = false;
    }
    visitBinaryOperation(node, ast) {
        this.commonVisit(node, ast);
        const isUnchecked = this.inUncheckedBlock;
        if (!((isUnchecked && (node.operator === '-' || node.operator === '+')) || node.operator === '**')) {
            return;
        }
        /* eslint-disable @typescript-eslint/no-empty-function */
        // TODO: Let's disable for now this lint report in the file. The other functions should be reviewed when
        // we do the bijection between Cairo1(uN) and Solidity(uintN). After that, the logic can be changed.
        const operatorMap = new Map([
            // Arith
            ['+', () => (0, unckeckedMathUtils_1.functionaliseUncheckedAdd)(node, ast)],
            ['-', () => (0, unckeckedMathUtils_1.functionaliseUncheckedSub)(node, ast)],
            ['**', () => (0, exp_1.functionaliseExp)(node, this.inUncheckedBlock, ast)],
            // Bitwise
            ['&', () => (0, bitwiseAnd_1.functionaliseBitwiseAnd)(node, ast)],
            ['|', () => (0, bitwiseOr_1.functionaliseBitwiseOr)(node, ast)],
            ['^', () => (0, xor_1.functionaliseXor)(node, ast)],
            ['<<', () => (0, shl_1.functionaliseShl)(node, ast)],
            ['>>', () => (0, shr_1.functionaliseShr)(node, ast)],
        ]);
        const thunk = operatorMap.get(node.operator);
        if (thunk === undefined) {
            throw new errors_1.NotSupportedYetError(`${node.operator} not supported yet`);
        }
        thunk();
    }
    visitUnaryOperation(node, ast) {
        this.commonVisit(node, ast);
        const operatorMap = new Map([
            ['-', () => (0, negate_1.functionaliseNegate)(node, ast)],
            ['~', () => (0, bitwiseNot_1.functionaliseBitwiseNot)(node, ast)],
            ['!', () => replaceNot(node, ast)],
            [
                'delete',
                () => {
                    return;
                },
            ],
        ]);
        const thunk = operatorMap.get(node.operator);
        if (thunk === undefined) {
            throw new errors_1.NotSupportedYetError(`${node.operator} not supported yet`);
        }
        thunk();
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        if (node.vExpression instanceof solc_typed_ast_1.Identifier &&
            node.vExpression.vReferencedDeclaration === undefined) {
            if (['mulmod', 'addmod'].includes(node.vExpression.name)) {
                const name = `warp_${node.vExpression.name}`;
                const importedFunc = ast.registerImport(node, [...importPaths_1.WARPLIB_MATHS, node.vExpression.name], name, [
                    ['x', (0, nodeTemplates_1.createUint256TypeName)(ast)],
                    ['y', (0, nodeTemplates_1.createUint256TypeName)(ast)],
                ], [['res', (0, nodeTemplates_1.createUint256TypeName)(ast)]]);
                const replacement = (0, functionGeneration_1.createCallToFunction)(importedFunc, node.vArguments, ast);
                ast.replaceNode(node, replacement);
            }
        }
    }
}
exports.MathsOperationToFunction = MathsOperationToFunction;
function replaceNot(node, ast) {
    ast.replaceNode(node, new solc_typed_ast_1.BinaryOperation(ast.reserveId(), node.src, node.typeString, '-', (0, nodeTemplates_1.createNumberLiteral)(1, ast, node.typeString), node.vSubExpression, node.raw));
}
//# sourceMappingURL=mathsOperationToFunction.js.map