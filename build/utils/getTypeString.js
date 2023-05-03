"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExpressionTypeString = exports.generateExpressionTypeStringForASTNode = exports.generateLiteralTypeString = exports.getReturnTypeString = exports.getFunctionTypeString = exports.getEnumTypeString = exports.getStructTypeString = exports.getContractTypeString = exports.getDeclaredTypeString = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const rationalLiteral_1 = require("../passes/literalExpressionEvaluator/rationalLiteral");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
function getDeclaredTypeString(declaration) {
    if (declaration.assignments.length === 1) {
        return declaration.vDeclarations[0].typeString;
    }
    const assignmentTypes = declaration.assignments.map((id) => {
        if (id === null)
            return '';
        const variable = declaration.vDeclarations.find((n) => n.id === id);
        (0, assert_1.default)(variable !== undefined, `${(0, astPrinter_1.printNode)(declaration)} attempts to assign to id ${id}, which is not in its declarations`);
        return variable.typeString;
    });
    return `tuple(${assignmentTypes.join(',')})`;
}
exports.getDeclaredTypeString = getDeclaredTypeString;
function getContractTypeString(node) {
    if (node.kind === solc_typed_ast_1.ContractKind.Interface) {
        return `type(contract ${node.name})`;
    }
    return `type(${node.kind} ${node.name})`;
}
exports.getContractTypeString = getContractTypeString;
function getStructTypeString(node) {
    return `struct ${node.name}`;
}
exports.getStructTypeString = getStructTypeString;
function getEnumTypeString(node) {
    return `enum ${node.name}`;
}
exports.getEnumTypeString = getEnumTypeString;
function getFunctionTypeString(node, inference, nodeInSourceUnit) {
    const inputs = node.vParameters.vParameters
        .map((decl) => {
        const baseType = (0, nodeTypeProcessing_1.safeGetNodeTypeInCtx)(decl, inference, nodeInSourceUnit ?? decl);
        if (baseType instanceof solc_typed_ast_1.ArrayType ||
            baseType instanceof solc_typed_ast_1.BytesType ||
            baseType instanceof solc_typed_ast_1.StringType ||
            (baseType instanceof solc_typed_ast_1.UserDefinedType && baseType.definition instanceof solc_typed_ast_1.StructDefinition)) {
            if (decl.storageLocation === solc_typed_ast_1.DataLocation.Default) {
                if (decl.vType instanceof solc_typed_ast_1.UserDefinedTypeName &&
                    (decl.vType.vReferencedDeclaration instanceof solc_typed_ast_1.EnumDefinition ||
                        decl.vType.vReferencedDeclaration instanceof solc_typed_ast_1.ContractDefinition)) {
                    return `${baseType.pp()}`;
                }
                throw new errors_1.NotSupportedYetError(`Default location ref parameter to string not supported yet: ${(0, astPrinter_1.printTypeNode)(baseType, true)} in ${node.name}`);
            }
            return `${baseType.pp()} ${decl.storageLocation}`;
        }
        return baseType.pp();
    })
        .join(', ');
    const visibility = node.visibility === solc_typed_ast_1.FunctionVisibility.Private || solc_typed_ast_1.FunctionVisibility.Default
        ? ''
        : ` ${node.visibility}`;
    const outputs = node.vReturnParameters.vParameters.length === 0
        ? ''
        : `returns (${node.vReturnParameters.vParameters.map((decl) => decl.typeString).join(', ')})`;
    return `function (${inputs})${visibility} ${node.stateMutability} ${outputs}`;
}
exports.getFunctionTypeString = getFunctionTypeString;
function getReturnTypeString(node, ast, nodeInSourceUnit) {
    const retParams = node.vReturnParameters.vParameters;
    const parametersTypeString = retParams
        .map((decl) => {
        const type = (0, nodeTypeProcessing_1.safeGetNodeTypeInCtx)(decl, ast.inference, nodeInSourceUnit ?? decl);
        return type instanceof solc_typed_ast_1.PointerType
            ? type
            : (0, solc_typed_ast_1.specializeType)((0, solc_typed_ast_1.generalizeType)(type)[0], decl.storageLocation);
    })
        .map(generateExpressionTypeString)
        .join(', ');
    if (retParams.length === 1) {
        return parametersTypeString;
    }
    else {
        return `tuple(${parametersTypeString})`;
    }
}
exports.getReturnTypeString = getReturnTypeString;
function generateLiteralTypeString(value, kind = solc_typed_ast_1.LiteralKind.Number) {
    switch (kind) {
        case solc_typed_ast_1.LiteralKind.Bool:
            return 'bool';
        case solc_typed_ast_1.LiteralKind.String:
            return `literal_string "${value}"`;
        case solc_typed_ast_1.LiteralKind.HexString:
            return `literal_string hex"${value}"`;
        case solc_typed_ast_1.LiteralKind.UnicodeString: {
            const encodedData = Buffer.from(value).toJSON().data;
            const hex_string = encodedData.reduce((acc, val) => acc + (val < 16 ? '0' : '') + val.toString(16), '');
            return `literal_string hex"${hex_string}"`;
        }
        case solc_typed_ast_1.LiteralKind.Number: {
            if (value.startsWith('0x')) {
                // Doesn't seem to have an effect on transpilation, but during tests "AST failed internal consistency check." is reported otherwise (eg. bitwise_shifting_constants_constantinople)
                value = BigInt(value).toString();
            }
            if (value.length > 32) {
                value = `${value.slice(0, 4)}...(${value.length - 8} digits omitted)...${value.slice(-4)}`;
            }
            return `int_const ${value}`;
        }
    }
}
exports.generateLiteralTypeString = generateLiteralTypeString;
function instanceOfNonRecursivePP(type) {
    return (type instanceof solc_typed_ast_1.AddressType ||
        type instanceof solc_typed_ast_1.BoolType ||
        type instanceof solc_typed_ast_1.BuiltinStructType ||
        type instanceof solc_typed_ast_1.BuiltinType ||
        type instanceof solc_typed_ast_1.BytesType ||
        type instanceof solc_typed_ast_1.FixedBytesType ||
        type instanceof solc_typed_ast_1.ImportRefType ||
        type instanceof solc_typed_ast_1.IntLiteralType ||
        type instanceof solc_typed_ast_1.IntType ||
        type instanceof rationalLiteral_1.RationalLiteral ||
        type instanceof solc_typed_ast_1.StringLiteralType ||
        type instanceof solc_typed_ast_1.StringType ||
        type instanceof solc_typed_ast_1.UserDefinedType);
}
function generateExpressionTypeStringForASTNode(node, type, inference) {
    if (type instanceof solc_typed_ast_1.IntLiteralType ||
        type instanceof solc_typed_ast_1.StringLiteralType ||
        type instanceof solc_typed_ast_1.BuiltinFunctionType) {
        return node.typeString;
    }
    if (node instanceof solc_typed_ast_1.TupleExpression) {
        if (node.isInlineArray === true) {
            const type = (0, nodeTypeProcessing_1.safeGetNodeType)(node, inference);
            if (type instanceof solc_typed_ast_1.TupleType) {
                return `${type.elements[0].getFields()[0]} memory`;
            }
            else if (type instanceof solc_typed_ast_1.ArrayType || type instanceof solc_typed_ast_1.PointerType) {
                return generateExpressionTypeString(type);
            }
        }
        if (node.vComponents.length === 0) {
            // E.g. `return abi.decode(data, (address, uint256));`
            (0, assert_1.default)(type instanceof solc_typed_ast_1.TupleType);
            return `tuple(${type.elements
                .map((element) => generateExpressionTypeString(element))
                .join(',')})`;
        }
        return `tuple(${node.vComponents
            .map((element) => generateExpressionTypeStringForASTNode(element, (0, nodeTypeProcessing_1.safeGetNodeType)(element, inference), inference))
            .join(',')})`;
    }
    return generateExpressionTypeString(type);
}
exports.generateExpressionTypeStringForASTNode = generateExpressionTypeStringForASTNode;
function generateExpressionTypeString(type) {
    if (type instanceof solc_typed_ast_1.PointerType) {
        if (type.to instanceof solc_typed_ast_1.MappingType)
            return generateExpressionTypeString(type.to);
        else
            return `${generateExpressionTypeString(type.to)} ${type.location}${type.kind !== undefined ? ' ' + type.kind : ''}`;
    }
    else if (type instanceof solc_typed_ast_1.FunctionType) {
        const mapper = (node) => generateExpressionTypeString(node);
        const argStr = type.parameters.map(mapper).join(',');
        let retStr = type.returns.map(mapper).join(',');
        retStr = retStr !== '' ? ` returns (${retStr})` : retStr;
        const visStr = type.visibility !== solc_typed_ast_1.FunctionVisibility.Internal ? ` ` + type.visibility : '';
        const mutStr = type.mutability !== 'nonpayable' ? ' ' + type.mutability : '';
        return `function ${type.name !== undefined ? type.name : ''}(${argStr})${mutStr}${visStr}${retStr}`;
    }
    else if (type instanceof solc_typed_ast_1.ArrayType) {
        return `${generateExpressionTypeString(type.elementT)}[${type.size !== undefined ? type.size : ''}]`;
    }
    else if (type instanceof solc_typed_ast_1.MappingType) {
        return `mapping(${generateExpressionTypeString(type.keyType)} => ${generateExpressionTypeString(type.valueType)})`;
    }
    else if (type instanceof solc_typed_ast_1.TupleType) {
        return `tuple(${type.elements
            .map((element) => generateExpressionTypeString(element))
            .join(',')})`;
    }
    else if (type instanceof solc_typed_ast_1.TypeNameType) {
        return `type(${generateExpressionTypeString(type.type)})`;
    }
    else if (instanceOfNonRecursivePP(type))
        return type.pp();
    else
        throw new errors_1.TranspileFailedError(`Unable to determine typestring for TypeNode #${type.id} ${type.pp()}`);
}
exports.generateExpressionTypeString = generateExpressionTypeString;
//# sourceMappingURL=getTypeString.js.map