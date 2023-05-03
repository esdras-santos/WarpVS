"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertConversionIfNecessary = exports.ImplicitConversionToExplicit = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const errors_1 = require("../utils/errors");
const formatting_1 = require("../utils/formatting");
const functionGeneration_1 = require("../utils/functionGeneration");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
/*
Detects implicit conversions by running solc-typed-ast's type analyser on
nodes and on where they're used and comparing the results. This approach is
relatively limited and does not handle tuples, which are instead processed by
TupleAssignmentSplitter. It also does not handle datalocation differences, which
are handled by the References pass

Prerequisites:
  TupleAssignmentSplitter
*/
class ImplicitConversionToExplicit extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // Conditionals pass generates cases that need to be handled by this pass
            'Cos',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitReturn(node, ast) {
        this.commonVisit(node, ast);
        if (node.vExpression === undefined)
            return;
        const returnDeclarations = node.vFunctionReturnParameters.vParameters;
        // Tuple returns handled by TupleAssignmentSplitter
        if (returnDeclarations.length !== 1)
            return;
        const expectedRetType = (0, nodeTypeProcessing_1.safeGetNodeType)(returnDeclarations[0], ast.inference);
        insertConversionIfNecessary(node.vExpression, expectedRetType, node, ast);
    }
    visitBinaryOperation(node, ast) {
        this.commonVisit(node, ast);
        const resultType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (node.operator === '<<' || node.operator === '>>') {
            insertConversionIfNecessary(node.vLeftExpression, resultType, node, ast);
            const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
            if (rhsType instanceof solc_typed_ast_1.IntLiteralType) {
                insertConversionIfNecessary(node.vRightExpression, (0, nodeTypeProcessing_1.intTypeForLiteral)(node.vRightExpression.typeString), node, ast);
            }
            return;
        }
        else if (node.operator === '**') {
            const rightNodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
            insertConversionIfNecessary(node.vLeftExpression, resultType, node, ast);
            if (rightNodeType instanceof solc_typed_ast_1.IntLiteralType) {
                const bound = getLiteralValueBound(node.vRightExpression.typeString);
                insertConversionIfNecessary(node.vRightExpression, (0, nodeTypeProcessing_1.intTypeForLiteral)(`int_const ${bound}`), node, ast);
            }
        }
        else if (['*', '/', '%', '+', '-', '&', '^', '|', '&&', '||'].includes(node.operator)) {
            insertConversionIfNecessary(node.vLeftExpression, resultType, node, ast);
            insertConversionIfNecessary(node.vRightExpression, resultType, node, ast);
        }
        else if (['<', '>', '<=', '>=', '==', '!='].includes(node.operator)) {
            const leftNodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftExpression, ast.inference);
            const rightNodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vRightExpression, ast.inference);
            const targetType = pickLargerType(leftNodeType, rightNodeType, leftNodeType instanceof solc_typed_ast_1.IntLiteralType
                ? getLiteralValueBound(node.vLeftExpression.typeString)
                : undefined, rightNodeType instanceof solc_typed_ast_1.IntLiteralType
                ? getLiteralValueBound(node.vRightExpression.typeString)
                : undefined);
            insertConversionIfNecessary(node.vLeftExpression, targetType, node, ast);
            insertConversionIfNecessary(node.vRightExpression, targetType, node, ast);
        }
    }
    // Implicit conversions are not deep
    // e.g. int32 = int16 + int8 -> int32 = int32(int16 + int16(int8)), not int32(int16) + int32(int8)
    // Handle signedness conversions (careful about difference between 0.7.0 and 0.8.0)
    visitAssignment(node, ast) {
        this.commonVisit(node, ast);
        insertConversionIfNecessary(node.vRightHandSide, (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftHandSide, ast.inference), node, ast);
    }
    visitVariableDeclarationStatement(node, ast) {
        this.commonVisit(node, ast);
        (0, assert_1.default)(node.vInitialValue !== undefined, `Implicit conversion to explicit expects variables to be initialized (did you run variable declaration initializer?). Found at ${(0, astPrinter_1.printNode)(node)}`);
        // Assuming all variable declarations are split and have an initial value
        // VariableDeclarationExpressionSplitter must be run before this pass
        if (node.assignments.length !== 1)
            return;
        insertConversionIfNecessary(node.vInitialValue, (0, nodeTypeProcessing_1.safeGetNodeType)(node.vDeclarations[0], ast.inference), node, ast);
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        if (node.kind === solc_typed_ast_1.FunctionCallKind.TypeConversion) {
            return;
        }
        if (node.vFunctionCallType === solc_typed_ast_1.ExternalReferenceType.Builtin) {
            // Skip the error message associated with asserts, requires, and reverts
            if (node.vFunctionName === 'revert') {
                return;
            }
            // post-audit TODO fixedbytes for second argument to allow non-literals
            if (['assert', 'require'].includes(node.vFunctionName) && node.vArguments.length > 1) {
                const paramType = (0, nodeTypeProcessing_1.getParameterTypes)(node, ast)[0];
                insertConversionIfNecessary(node.vArguments[0], paramType, node, ast);
                return;
            }
            if (['push', 'pop'].includes(node.vFunctionName)) {
                const paramTypes = (0, nodeTypeProcessing_1.getParameterTypes)(node, ast);
                // Solc 0.7.0 types push and pop as you would expect, 0.8.0 adds an extra initial argument
                (0, assert_1.default)(paramTypes.length >= node.vArguments.length, (0, formatting_1.error)(`${(0, astPrinter_1.printNode)(node)} has incorrect number of arguments. Expected ${paramTypes.length}, got ${node.vArguments.length}`));
                node.vArguments.forEach((arg, index) => {
                    const paramIndex = index + paramTypes.length - node.vArguments.length;
                    insertConversionIfNecessary(arg, paramTypes[paramIndex], node, ast);
                });
                return;
            }
            if (node.vFunctionName === 'concat') {
                handleConcatArgs(node, ast);
                return;
            }
            if (node.vFunctionName === 'decode') {
                (0, assert_1.default)(node.vArguments.length === 2, 'decode receives two arguments');
                insertConversionIfNecessary(node.vArguments[0], new solc_typed_ast_1.BytesType(), node, ast);
                return;
            }
            if (['encodePacked', 'encode'].includes(node.vFunctionName)) {
                handleAbiEncodeArgs(node.vArguments, ast);
                return;
            }
            if (['encodeWithSelector', 'encodeWithSignature'].includes(node.vFunctionName)) {
                (0, assert_1.default)(node.vArguments.length > 0, `${node.vFunctionName} requires at least one argument`);
                const targetType = node.vFunctionName === 'encodeWithSelector' ? new solc_typed_ast_1.FixedBytesType(4) : new solc_typed_ast_1.StringType();
                insertConversionIfNecessary(node.vArguments[0], targetType, node.vArguments[0], ast);
                handleAbiEncodeArgs(node.vArguments.slice(1), ast);
                return;
            }
        }
        const paramTypes = (0, nodeTypeProcessing_1.getParameterTypes)(node, ast);
        (0, assert_1.default)(paramTypes.length === node.vArguments.length, (0, formatting_1.error)(`${(0, astPrinter_1.printNode)(node)} has incorrect number of arguments. Expected ${paramTypes.length}, got ${node.vArguments.length}`));
        node.vArguments.forEach((arg, index) => insertConversionIfNecessary(arg, paramTypes[index], node, ast));
    }
    visitIndexAccess(node, ast) {
        this.commonVisit(node, ast);
        if (node.vIndexExpression === undefined)
            return;
        const [baseType, location] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node.vBaseExpression, ast.inference));
        if (baseType instanceof solc_typed_ast_1.MappingType) {
            insertConversionIfNecessary(node.vIndexExpression, baseType.keyType, node, ast);
        }
        else if (location === solc_typed_ast_1.DataLocation.CallData ||
            (node.vBaseExpression instanceof solc_typed_ast_1.FunctionCall && (0, utils_1.isExternalCall)(node.vBaseExpression))) {
            insertConversionIfNecessary(node.vIndexExpression, new solc_typed_ast_1.IntType(248, false), node, ast);
        }
        else {
            insertConversionIfNecessary(node.vIndexExpression, new solc_typed_ast_1.IntType(256, false), node, ast);
        }
    }
    visitTupleExpression(node, ast) {
        if (!node.isInlineArray)
            return this.visitExpression(node, ast);
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference))[0];
        (0, assert_1.default)(type instanceof solc_typed_ast_1.ArrayType, `Expected inline array ${(0, astPrinter_1.printNode)(node)} to be array type, got ${(0, astPrinter_1.printTypeNode)(type)}`);
        node.vComponents.forEach((element) => insertConversionIfNecessary(element, type.elementT, node, ast));
        this.visitExpression(node, ast);
    }
    visitUnaryOperation(node, ast) {
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (nodeType instanceof solc_typed_ast_1.IntLiteralType) {
            node.typeString = (0, nodeTypeProcessing_1.intTypeForLiteral)(`int_const ${getLiteralValueBound(node.typeString)}`).pp();
        }
        this.commonVisit(node, ast);
    }
}
exports.ImplicitConversionToExplicit = ImplicitConversionToExplicit;
function insertConversionIfNecessary(expression, targetType, context, ast) {
    const type = (0, nodeTypeProcessing_1.safeGetNodeType)(expression, ast.inference);
    const [currentType, currentLoc] = (0, solc_typed_ast_1.generalizeType)(type);
    const generalisedTargetType = (0, solc_typed_ast_1.generalizeType)(targetType)[0];
    if (currentType instanceof solc_typed_ast_1.AddressType) {
        if (!(generalisedTargetType instanceof solc_typed_ast_1.AddressType)) {
            insertConversion(expression, generalisedTargetType, context, ast);
        }
    }
    else if (currentType instanceof solc_typed_ast_1.ArrayType) {
        (0, assert_1.default)(generalisedTargetType instanceof solc_typed_ast_1.ArrayType, `Unable to convert array ${(0, astPrinter_1.printNode)(expression)} to non-array type ${(0, astPrinter_1.printTypeNode)(generalisedTargetType)}`);
        if (currentLoc === solc_typed_ast_1.DataLocation.Memory) {
            const parent = expression.parent;
            const [replacement, shouldReplace] = ast
                .getUtilFuncGen(expression)
                .memory.convert.genIfNecessary(expression, targetType);
            if (shouldReplace) {
                ast.replaceNode(expression, replacement, parent);
            }
        }
        // if (expression instanceof TupleExpression && expression.isInlineArray) {
        //   expression.vOriginalComponents.forEach((element) => {
        //     assert(element !== null, `Unexpected empty slot in inline array ${printNode(expression)}`);
        //     insertConversionIfNecessary(element, elementT, ast);
        //   });
        //   expression.typeString = generateExpressionTypeString(
        //     specializeType(targetType, DataLocation.Memory),
        //   );
        // }
    }
    else if (currentType instanceof solc_typed_ast_1.BoolType) {
        (0, assert_1.default)(generalisedTargetType instanceof solc_typed_ast_1.BoolType, `Unable to convert bool to ${(0, astPrinter_1.printTypeNode)(generalisedTargetType)}`);
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.BuiltinType) {
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.BytesType) {
        if (generalisedTargetType instanceof solc_typed_ast_1.BytesType || generalisedTargetType instanceof solc_typed_ast_1.StringType) {
            return;
        }
        if (generalisedTargetType instanceof solc_typed_ast_1.FixedBytesType) {
            throw new errors_1.NotSupportedYetError(`${(0, astPrinter_1.printTypeNode)(currentType)} to fixed bytes type (${targetType.pp()}) not implemented yet`);
        }
        else {
            throw new errors_1.TranspileFailedError(`Unexpected implicit conversion from ${currentType.pp()} to ${targetType.pp()}`);
        }
    }
    else if (currentType instanceof solc_typed_ast_1.FixedBytesType) {
        if (generalisedTargetType instanceof solc_typed_ast_1.BytesType || generalisedTargetType instanceof solc_typed_ast_1.StringType) {
            insertConversionIfNecessary(expression, generalisedTargetType, context, ast);
        }
        else if (generalisedTargetType instanceof solc_typed_ast_1.FixedBytesType) {
            if (currentType.size !== generalisedTargetType.size) {
                insertConversion(expression, generalisedTargetType, context, ast);
            }
        }
        else {
            throw new errors_1.TranspileFailedError(`Unexpected implicit conversion from ${currentType.pp()} to ${generalisedTargetType.pp()}`);
        }
    }
    else if (currentType instanceof solc_typed_ast_1.FunctionType) {
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.ImportRefType) {
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.IntLiteralType) {
        insertConversion(expression, generalisedTargetType, context, ast);
    }
    else if (currentType instanceof solc_typed_ast_1.IntType) {
        if (generalisedTargetType instanceof solc_typed_ast_1.IntType &&
            generalisedTargetType.pp() === currentType.pp()) {
            return;
        }
        else {
            insertConversion(expression, generalisedTargetType, context, ast);
        }
    }
    else if (currentType instanceof solc_typed_ast_1.MappingType) {
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.StringType) {
        if (generalisedTargetType instanceof solc_typed_ast_1.BytesType || generalisedTargetType instanceof solc_typed_ast_1.StringType) {
            return;
        }
        if (generalisedTargetType instanceof solc_typed_ast_1.FixedBytesType) {
            throw new errors_1.NotSupportedYetError(`${(0, astPrinter_1.printTypeNode)(currentType)} to fixed bytes type (${generalisedTargetType.pp()}) not implemented yet`);
        }
        else {
            throw new errors_1.TranspileFailedError(`Unexpected implicit conversion from ${currentType.pp()} to ${generalisedTargetType.pp()}`);
        }
    }
    else if (currentType instanceof solc_typed_ast_1.PointerType) {
        throw new errors_1.TranspileFailedError(`Type conversion analysis error. Unexpected ${(0, astPrinter_1.printTypeNode)(currentType)}, found at ${(0, astPrinter_1.printNode)(expression)}`);
    }
    else if (currentType instanceof solc_typed_ast_1.RationalLiteralType) {
        throw new errors_1.TranspileFailedError(`Unexpected unresolved rational literal ${(0, astPrinter_1.printNode)(expression)}`);
    }
    else if (currentType instanceof solc_typed_ast_1.StringLiteralType) {
        if (generalisedTargetType instanceof solc_typed_ast_1.FixedBytesType) {
            if (!(expression instanceof solc_typed_ast_1.Literal)) {
                throw new errors_1.TranspileFailedError(`Expected stringLiteralType expression to be a Literal`);
            }
            const padding = '0'.repeat(generalisedTargetType.size * 2 - expression.hexValue.length);
            const replacementNode = (0, nodeTemplates_1.createNumberLiteral)(`0x${expression.hexValue}${padding}`, ast, generalisedTargetType.pp());
            ast.replaceNode(expression, replacementNode, expression.parent);
            insertConversion(replacementNode, generalisedTargetType, context, ast);
        }
        else if (generalisedTargetType instanceof solc_typed_ast_1.StringType ||
            generalisedTargetType instanceof solc_typed_ast_1.BytesType) {
            insertConversion(expression, generalisedTargetType, context, ast);
        }
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.TupleType) {
        if (!(targetType instanceof solc_typed_ast_1.TupleType)) {
            throw new errors_1.TranspileFailedError(`Attempted to convert tuple ${(0, astPrinter_1.printNode)(expression)} as single value`);
        }
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.TypeNameType) {
        return;
    }
    else if (currentType instanceof solc_typed_ast_1.UserDefinedType) {
        return;
    }
    else {
        throw new errors_1.NotSupportedYetError(`Encountered unexpected type ${(0, astPrinter_1.printTypeNode)(currentType)} during type conversion analysis at ${(0, astPrinter_1.printNode)(expression)}`);
    }
}
exports.insertConversionIfNecessary = insertConversionIfNecessary;
function insertConversion(expression, targetType, context, ast) {
    const typeName = (0, utils_1.typeNameFromTypeNode)(targetType, ast);
    (0, assert_1.default)(typeName instanceof solc_typed_ast_1.ElementaryTypeName, `Attempted elementary conversion to non-elementary type: ${(0, nodeTypeProcessing_1.safeGetNodeType)(expression, ast.inference).pp()} -> ${(0, astPrinter_1.printTypeNode)(targetType)}`);
    const parent = expression.parent;
    const call = (0, functionGeneration_1.createElementaryConversionCall)(typeName, expression, context, ast);
    ast.replaceNode(expression, call, parent);
}
function pickLargerType(typeA, typeB, leftLiteralBound, rightLiteralBound) {
    // Generalise the types to remove any location differences
    typeA = (0, solc_typed_ast_1.generalizeType)(typeA)[0];
    typeB = (0, solc_typed_ast_1.generalizeType)(typeB)[0];
    if (typeA.pp() === typeB.pp()) {
        if (typeA instanceof solc_typed_ast_1.IntLiteralType) {
            (0, assert_1.default)(typeA.literal !== undefined, `Unexpected unencoded literal value`);
            (0, assert_1.default)(leftLiteralBound !== undefined, `Unexpected unencoded literal value`);
            return (0, nodeTypeProcessing_1.intTypeForLiteral)(`int_const ${leftLiteralBound}`);
        }
        return typeA;
    }
    if (typeA instanceof solc_typed_ast_1.AddressType && typeB instanceof solc_typed_ast_1.AddressType) {
        // when pp() does not match, it means an address is payable and the other is
        // not. Stay with the non payable one
        return typeA.payable ? typeB : typeA;
    }
    // Literals always need to be cast to match the other type
    if (typeA instanceof solc_typed_ast_1.IntLiteralType) {
        if (typeB instanceof solc_typed_ast_1.IntLiteralType) {
            (0, assert_1.default)(typeA.literal !== undefined, `Unexpected unencoded literal value`);
            (0, assert_1.default)(typeB.literal !== undefined, `Unexpected unencoded literal value`);
            (0, assert_1.default)(leftLiteralBound !== undefined && rightLiteralBound !== undefined, `Unexpected literal bounds`);
            return pickLargerType((0, nodeTypeProcessing_1.intTypeForLiteral)(`int_const ${leftLiteralBound}`), (0, nodeTypeProcessing_1.intTypeForLiteral)(`int_const ${rightLiteralBound}`));
        }
        else {
            return typeB;
        }
    }
    else if (typeB instanceof solc_typed_ast_1.IntLiteralType) {
        return typeA;
    }
    if (typeA instanceof solc_typed_ast_1.StringLiteralType) {
        return typeB;
    }
    else if (typeB instanceof solc_typed_ast_1.StringLiteralType) {
        return typeA;
    }
    if (typeA instanceof solc_typed_ast_1.IntType) {
        if (typeB instanceof solc_typed_ast_1.IntType) {
            if (typeA.nBits > typeB.nBits) {
                return typeA;
            }
        }
        return typeB;
    }
    else if (typeB instanceof solc_typed_ast_1.IntType) {
        return typeA;
    }
    if (typeA instanceof solc_typed_ast_1.FixedBytesType) {
        if (typeB instanceof solc_typed_ast_1.FixedBytesType) {
            if (typeA.size > typeB.size) {
                return typeA;
            }
        }
        return typeB;
    }
    else if (typeB instanceof solc_typed_ast_1.FixedBytesType) {
        return typeA;
    }
    if (typeA instanceof solc_typed_ast_1.ArrayType && typeB instanceof solc_typed_ast_1.ArrayType) {
        (0, assert_1.default)(typeA.size === typeB.size, `Unable to find a common type for arrays of mismatching lengths: ${(0, astPrinter_1.printTypeNode)(typeA)} vs ${(0, astPrinter_1.printTypeNode)(typeB)}`);
        return new solc_typed_ast_1.ArrayType(pickLargerType(typeA.elementT, typeB.elementT), typeA.size);
    }
    throw new errors_1.NotSupportedYetError(`Unhandled type conversion case: ${(0, astPrinter_1.printTypeNode)(typeA)} vs ${(0, astPrinter_1.printTypeNode)(typeB)}`);
}
function getLiteralValueBound(typeString) {
    // remove any character that is not a digit or '('or ')' or '-'
    const cleanTypeString = typeString.replace(/[^\d()-]/g, '');
    // assert '-' is only used for negative numbers
    (0, assert_1.default)(cleanTypeString.indexOf('-') === -1 || cleanTypeString.indexOf('-') === 0, `Unexpected literal value: ${typeString}`);
    // if it doesn't contain '(', it is a literal
    if (!cleanTypeString.includes('(')) {
        //assert it has no ')'
        (0, assert_1.default)(!cleanTypeString.includes(')'), `Unexpected ')' in literal value bound: ${typeString}`);
        return cleanTypeString;
    }
    // get string between '(', ')' and type-cast to int
    const literalValue = parseInt(cleanTypeString.substring(cleanTypeString.indexOf('(') + 1, cleanTypeString.indexOf(')')));
    // replace string between '(', ')' with literal value number of zeros
    const newTypeString = cleanTypeString.replace(`(${literalValue})`, '9'.repeat(literalValue));
    const maxBound = BigInt(`2`) ** BigInt(`256`) - BigInt(1);
    const minBound = BigInt(`-2`) ** BigInt(`255`) + BigInt(1);
    if (maxBound < BigInt(newTypeString)) {
        // solidity doesn't support literals larger than 256 bits
        return maxBound.toString();
    }
    if (minBound > BigInt(newTypeString)) {
        // solidity doesn't support literals smaller than 255 bits
        return minBound.toString();
    }
    return newTypeString;
}
function handleConcatArgs(node, ast) {
    node.vArguments.forEach((arg) => {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(arg, ast.inference);
        if (type instanceof solc_typed_ast_1.StringLiteralType) {
            const literal = arg.value;
            if (literal.length < 32 && literal.length > 0) {
                insertConversionIfNecessary(arg, new solc_typed_ast_1.FixedBytesType(literal.length), node, ast);
            }
            else {
                insertConversionIfNecessary(arg, new solc_typed_ast_1.BytesType(), node, ast);
            }
        }
    });
}
function handleAbiEncodeArgs(args, ast) {
    args.forEach((arg) => {
        const type = (0, nodeTypeProcessing_1.safeGetNodeType)(arg, ast.inference);
        if (type instanceof solc_typed_ast_1.StringLiteralType) {
            insertConversionIfNecessary(arg, new solc_typed_ast_1.BytesType(), arg, ast);
        }
        else if (type instanceof solc_typed_ast_1.IntLiteralType) {
            (0, assert_1.default)(arg instanceof solc_typed_ast_1.Literal);
            const signed = BigInt(arg.value) < 0;
            insertConversionIfNecessary(arg, new solc_typed_ast_1.IntType(256, signed), arg, ast);
        }
    });
}
//# sourceMappingURL=implicitConversionToExplicit.js.map