"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplicitConversionToFunc = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const mapper_1 = require("../../ast/mapper");
const errors_1 = require("../../utils/errors");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const int_1 = require("../../warplib/implementations/conversions/int");
const functionGeneration_1 = require("../../utils/functionGeneration");
const fixedBytes_1 = require("../../warplib/implementations/conversions/fixedBytes");
const dynBytesToFixed_1 = require("../../warplib/implementations/conversions/dynBytesToFixed");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
class ExplicitConversionToFunc extends mapper_1.ASTMapper {
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        if (node.kind !== solc_typed_ast_1.FunctionCallKind.TypeConversion)
            return;
        const typeNameType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        (0, assert_1.default)(node.vArguments.length === 1, `Expecting typeconversion to have one child`);
        // Since we are only considering type conversions typeTo will always be a TypeNameType
        (0, assert_1.default)(typeNameType instanceof solc_typed_ast_1.TypeNameType, `Got non-typename type ${typeNameType.pp()} when parsing conversion function ${node.vFunctionName}`);
        if (typeNameType.type instanceof solc_typed_ast_1.UserDefinedType &&
            typeNameType.type.definition instanceof solc_typed_ast_1.ContractDefinition) {
            const operand = node.vArguments[0];
            operand.typeString = node.typeString;
            ast.replaceNode(node, operand);
            return;
        }
        (0, assert_1.default)(node.vExpression instanceof solc_typed_ast_1.ElementaryTypeNameExpression, `Unexpected node type ${node.vExpression.type}`);
        const typeTo = (0, solc_typed_ast_1.generalizeType)(typeNameType.type)[0];
        const argType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vArguments[0], ast.inference))[0];
        if (typeTo instanceof solc_typed_ast_1.IntType) {
            if (argType instanceof solc_typed_ast_1.FixedBytesType) {
                (0, assert_1.default)(typeTo.nBits === argType.size * 8, `Unexpected size changing ${argType.pp()}->${typeTo.pp()} conversion encountered`);
                const operand = node.vArguments[0];
                operand.typeString = node.typeString;
                ast.replaceNode(node, operand);
            }
            else if (argType instanceof solc_typed_ast_1.IntLiteralType) {
                ast.replaceNode(node, literalToTypedInt(node.vArguments[0], typeTo));
            }
            else if (argType instanceof solc_typed_ast_1.IntType) {
                (0, int_1.functionaliseIntConversion)(node, ast);
            }
            else if (argType instanceof solc_typed_ast_1.AddressType) {
                const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ...importPaths_1.FELT_TO_UINT256, [['address_arg', (0, nodeTemplates_1.createAddressTypeName)(false, ast)]], [['uint_ret', (0, nodeTemplates_1.createUint256TypeName)(ast)]]), [node.vArguments[0]], ast);
                ast.replaceNode(node, replacementCall);
            }
            else {
                throw new errors_1.NotSupportedYetError(`Unexpected type ${(0, astPrinter_1.printTypeNode)(argType)} in uint256 conversion`);
            }
            return;
        }
        if (typeTo instanceof solc_typed_ast_1.AddressType) {
            if ((argType instanceof solc_typed_ast_1.IntType && argType.nBits === 256) ||
                (argType instanceof solc_typed_ast_1.FixedBytesType && argType.size === 32)) {
                const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, [...importPaths_1.WARPLIB_MATHS, 'utils'], 'uint256_to_address_felt', [['uint_arg', (0, nodeTemplates_1.createUint256TypeName)(ast)]], [['address_ret', (0, nodeTemplates_1.createAddressTypeName)(false, ast)]]), [node.vArguments[0]], ast);
                ast.replaceNode(node, replacementCall);
            }
            else {
                ast.replaceNode(node, node.vArguments[0]);
            }
            return;
        }
        if (typeTo instanceof solc_typed_ast_1.FixedBytesType) {
            if (argType instanceof solc_typed_ast_1.AddressType) {
                const replacementCall = (0, functionGeneration_1.createCallToFunction)(ast.registerImport(node, ...importPaths_1.FELT_TO_UINT256, [['address_arg', (0, nodeTemplates_1.createAddressTypeName)(false, ast)]], [['uint_ret', (0, nodeTemplates_1.createUint256TypeName)(ast)]]), [node.vArguments[0]], ast);
                ast.replaceNode(node, replacementCall);
                return;
            }
            else if (argType instanceof solc_typed_ast_1.BytesType) {
                (0, dynBytesToFixed_1.functionaliseBytesToFixedBytes)(node, typeTo, ast);
                return;
            }
            else if (argType instanceof solc_typed_ast_1.FixedBytesType) {
                (0, fixedBytes_1.functionaliseFixedBytesConversion)(node, ast);
                return;
            }
            else if (argType instanceof solc_typed_ast_1.IntLiteralType) {
                ast.replaceNode(node, literalToFixedBytes(node.vArguments[0], typeTo));
                return;
            }
            else if (argType instanceof solc_typed_ast_1.IntType) {
                (0, assert_1.default)(typeTo.size * 8 >= argType.nBits, `Unexpected narrowing ${argType.pp()}->${typeTo.pp()} conversion encountered`);
                const operand = node.vArguments[0];
                operand.typeString = node.typeString;
                ast.replaceNode(node, operand);
                return;
            }
            else if (argType instanceof solc_typed_ast_1.StringLiteralType) {
                const replacement = literalToFixedBytes(node.vArguments[0], typeTo);
                ast.replaceNode(node, replacement);
                return;
            }
        }
        if (typeTo instanceof solc_typed_ast_1.BytesType || typeTo instanceof solc_typed_ast_1.StringType) {
            if (argType instanceof solc_typed_ast_1.BytesType || argType instanceof solc_typed_ast_1.StringType) {
                const operand = node.vArguments[0];
                operand.typeString = node.typeString;
                ast.replaceNode(node, operand);
                return;
            }
        }
        throw new errors_1.NotSupportedYetError(`${(0, astPrinter_1.printTypeNode)(argType)} to ${(0, astPrinter_1.printTypeNode)(typeTo)} conversion not supported yet`);
    }
}
exports.ExplicitConversionToFunc = ExplicitConversionToFunc;
// This both truncates values that are too large to fit in the given type range,
// and also converts negative literals to two's complement
function literalToTypedInt(arg, typeTo) {
    (0, assert_1.default)(arg instanceof solc_typed_ast_1.Literal, `Found non-literal ${(0, astPrinter_1.printNode)(arg)} to have literal type ${arg.typeString}`);
    const truncated = (0, utils_1.bigintToTwosComplement)(BigInt(arg.value), typeTo.nBits).toString(10);
    arg.value = truncated;
    arg.hexValue = (0, utils_1.toHexString)(truncated);
    arg.typeString = typeTo.pp();
    return arg;
}
function literalToFixedBytes(arg, typeTo) {
    (0, assert_1.default)(arg instanceof solc_typed_ast_1.Literal, `Found non-literal ${(0, astPrinter_1.printNode)(arg)} to have literal type ${arg.typeString}`);
    if (arg.kind === solc_typed_ast_1.LiteralKind.HexString || arg.kind === solc_typed_ast_1.LiteralKind.String) {
        if (arg.hexValue.length < typeTo.size * 2) {
            arg.hexValue = `${arg.hexValue}${'0'.repeat(typeTo.size * 2 - arg.hexValue.length)}`;
        }
    }
    arg.typeString = typeTo.pp();
    if (arg.kind === solc_typed_ast_1.LiteralKind.String)
        arg.kind = solc_typed_ast_1.LiteralKind.HexString;
    return arg;
}
//# sourceMappingURL=explicitConversionToFunc.js.map