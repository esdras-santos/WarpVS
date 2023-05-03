"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchExecSyncError = exports.execSyncAndLog = exports.defaultBasePathAndIncludePath = exports.traverseChildren = exports.traverseParent = exports.NODE_MODULES_MARKER = exports.getContainingSourceUnit = exports.getContainingFunction = exports.runStarknetClassHash = exports.getSourceFromLocations = exports.isCalldataDynArrayStruct = exports.isExternalMemoryDynArray = exports.isExternalCall = exports.isBlock = exports.mangleOwnContractInterface = exports.mangleStructName = exports.functionAffectsState = exports.expressionHasSideEffects = exports.toUintOrFelt = exports.splitDarray = exports.isNameless = exports.toSingleExpression = exports.isExternallyVisible = exports.isCairoConstant = exports.narrowBigIntSafe = exports.narrowBigInt = exports.bigintToTwosComplement = exports.countNestedMapItems = exports.groupBy = exports.typeNameFromTypeNode = exports.mapRange = exports.printCompileErrors = exports.extractProperty = exports.exactInstanceOf = exports.runSanityCheck = exports.unitValue = exports.toHexString = exports.counterGenerator = exports.union = exports.primitiveTypeToCairo = exports.isCairoPrimitiveIntType = exports.divmod = void 0;
const fs = __importStar(require("fs"));
const assert_1 = __importDefault(require("assert"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const solc_typed_ast_1 = require("solc-typed-ast");
const web3_1 = __importDefault(require("web3"));
const astChecking_1 = require("./astChecking");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const nodeTemplates_1 = require("./nodeTemplates");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
const uint128 = BigInt('0x100000000000000000000000000000000');
function divmod(x, y) {
    const div = BigInt(x / y);
    const rem = BigInt(x % y);
    return [div, rem];
}
exports.divmod = divmod;
const cairoPrimitiveIntTypes = [
    'u8',
    'u16',
    'u24',
    'u32',
    'u40',
    'u48',
    'u56',
    'u64',
    'u72',
    'u80',
    'u88',
    'u96',
    'u104',
    'u112',
    'u120',
    'u128',
    'u136',
    'u144',
    'u152',
    'u160',
    'u168',
    'u176',
    'u184',
    'u192',
    'u200',
    'u208',
    'u216',
    'u224',
    'u232',
    'u240',
    'u248',
    'u256',
];
const isCairoPrimitiveIntType = (x) => {
    return cairoPrimitiveIntTypes.includes(x);
};
exports.isCairoPrimitiveIntType = isCairoPrimitiveIntType;
function primitiveTypeToCairo(typeString) {
    if (typeString === 'address' || typeString === 'address payable')
        return 'ContractAddress';
    if (typeString === 'uint' || typeString === 'int')
        return 'u256';
    if (typeString === 'fixed' || typeString === 'ufixed') {
        throw new errors_1.NotSupportedYetError('Fixed types not implemented');
    }
    // regex match if typeString is uintN or intN
    const uintMatch = typeString.match(/^uint([0-9]+)$/);
    const intMatch = typeString.match(/^int([0-9]+)$/);
    if (uintMatch) {
        const bits = BigInt(uintMatch[1]);
        if (bits > 256) {
            throw new errors_1.NotSupportedYetError('uint types larger than 256 bits not supported');
        }
        return `u${bits}`;
    }
    if (intMatch) {
        const bits = BigInt(intMatch[1]);
        if (bits > 256) {
            throw new errors_1.NotSupportedYetError('int types larger than 256 bits not supported');
        }
        return `u${bits}`;
    }
    return 'felt';
}
exports.primitiveTypeToCairo = primitiveTypeToCairo;
function union(setA, setB) {
    const _union = new Set(setA);
    for (const elem of setB) {
        _union.add(elem);
    }
    return _union;
}
exports.union = union;
function* counterGenerator(start = 0) {
    let count = start;
    while (true) {
        yield count;
        count++;
    }
}
exports.counterGenerator = counterGenerator;
function toHexString(stringValue) {
    return stringValue
        .split('')
        .map((c) => {
        // All expected characters have 2digit ascii hex codes,
        // so no need to set to fixed length
        return c.charCodeAt(0).toString(16);
    })
        .join('');
}
exports.toHexString = toHexString;
function unitValue(unit) {
    if (unit === undefined) {
        return 1;
    }
    switch (unit) {
        case solc_typed_ast_1.EtherUnit.Wei:
            return 1;
        case solc_typed_ast_1.EtherUnit.GWei:
            return 10 ** 9;
        case solc_typed_ast_1.EtherUnit.Szabo:
            return 10 ** 12;
        case solc_typed_ast_1.EtherUnit.Finney:
            return 10 ** 15;
        case solc_typed_ast_1.EtherUnit.Ether:
            return 10 ** 18;
        case solc_typed_ast_1.TimeUnit.Seconds:
            return 1;
        case solc_typed_ast_1.TimeUnit.Minutes:
            return 60;
        case solc_typed_ast_1.TimeUnit.Hours:
            return 60 * 60;
        case solc_typed_ast_1.TimeUnit.Days:
            return 24 * 60 * 60;
        case solc_typed_ast_1.TimeUnit.Weeks:
            return 7 * 24 * 60 * 60;
        case solc_typed_ast_1.TimeUnit.Years: // Removed since solidity 0.5.0, handled for completeness
            return 365 * 24 * 60 * 60;
        default:
            throw new errors_1.TranspileFailedError('Encountered unknown unit');
    }
}
exports.unitValue = unitValue;
function runSanityCheck(ast, options, passName) {
    const printResult = options.checkTrees ?? false;
    if (printResult)
        console.log(`Running sanity check after ${passName}`);
    if ((0, astChecking_1.isSane)(ast, options.dev)) {
        if (printResult)
            console.log('AST passed sanity check');
        return true;
    }
    if (printResult)
        console.log('AST failed sanity check');
    return false;
}
exports.runSanityCheck = runSanityCheck;
// Returns whether x is of type T but not any subclass of T
function exactInstanceOf(x, typeName) {
    return x instanceof typeName && !(Object.getPrototypeOf(x) instanceof typeName);
}
exports.exactInstanceOf = exactInstanceOf;
function extractProperty(propName, obj) {
    return extractDeepProperty(propName, obj, 0);
}
exports.extractProperty = extractProperty;
const MaxSearchDepth = 100;
function extractDeepProperty(propName, obj, currentDepth) {
    // No non-adversarially created object should ever reach this, but since prototype loops are technically possible
    if (currentDepth > MaxSearchDepth) {
        return undefined;
    }
    const entry = Object.entries(obj).find(([name]) => name === propName);
    if (entry === undefined) {
        const prototype = Object.getPrototypeOf(obj);
        if (prototype !== null) {
            return extractDeepProperty(propName, Object.getPrototypeOf(obj), currentDepth + 1);
        }
        else {
            return undefined;
        }
    }
    return entry[1];
}
function printCompileErrors(e) {
    (0, errors_1.logError)('---Compile Failed---');
    e.failures.forEach((failure) => {
        (0, errors_1.logError)(`Compiler version ${failure.compilerVersion} reported errors:`);
        failure.errors.forEach((error, index) => {
            (0, errors_1.logError)(`    --${index + 1}--`);
            const errorLines = error.split('\n');
            errorLines.forEach((line) => (0, errors_1.logError)(`    ${line}`));
        });
    });
}
exports.printCompileErrors = printCompileErrors;
function mapRange(n, func) {
    return [...Array(n).keys()].map(func);
}
exports.mapRange = mapRange;
function typeNameFromTypeNode(node, ast) {
    node = (0, solc_typed_ast_1.generalizeType)(node)[0];
    let result = null;
    if (node instanceof solc_typed_ast_1.AddressType) {
        result = (0, nodeTemplates_1.createAddressTypeName)(node.payable, ast);
    }
    else if (node instanceof solc_typed_ast_1.ArrayType) {
        result = new solc_typed_ast_1.ArrayTypeName(ast.reserveId(), '', node.pp(), typeNameFromTypeNode(node.elementT, ast), node.size === undefined ? undefined : (0, nodeTemplates_1.createNumberLiteral)(node.size, ast));
    }
    else if (node instanceof solc_typed_ast_1.BytesType) {
        result = (0, nodeTemplates_1.createBytesTypeName)(ast);
    }
    else if (node instanceof solc_typed_ast_1.BoolType) {
        result = (0, nodeTemplates_1.createBoolTypeName)(ast);
    }
    else if (node instanceof solc_typed_ast_1.FixedBytesType) {
        result = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', node.pp(), node.pp());
    }
    else if (node instanceof solc_typed_ast_1.IntLiteralType) {
        throw new errors_1.TranspileFailedError(`Attempted to create typename for int literal`);
    }
    else if (node instanceof solc_typed_ast_1.IntType) {
        result = new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', node.pp(), node.pp());
    }
    else if (node instanceof solc_typed_ast_1.PointerType) {
        result = typeNameFromTypeNode(node.to, ast);
    }
    else if (node instanceof solc_typed_ast_1.MappingType) {
        const key = typeNameFromTypeNode(node.keyType, ast);
        const value = typeNameFromTypeNode(node.valueType, ast);
        result = new solc_typed_ast_1.Mapping(ast.reserveId(), '', `mapping(${key.typeString} => ${value.typeString})`, key, value);
    }
    else if (node instanceof solc_typed_ast_1.UserDefinedType) {
        return new solc_typed_ast_1.UserDefinedTypeName(ast.reserveId(), '', node.pp(), node.definition.name, node.definition.id, new solc_typed_ast_1.IdentifierPath(ast.reserveId(), '', node.definition.name, node.definition.id));
    }
    else if (node instanceof solc_typed_ast_1.StringType || node instanceof solc_typed_ast_1.StringLiteralType) {
        return new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'string', 'string', 'nonpayable');
    }
    if (result === null) {
        throw new errors_1.NotSupportedYetError(`${(0, astPrinter_1.printTypeNode)(node)} to typename not implemented yet`);
    }
    ast.setContextRecursive(result);
    return result;
}
exports.typeNameFromTypeNode = typeNameFromTypeNode;
function groupBy(arr, groupFunc) {
    const grouped = new Map();
    arr.forEach((v) => {
        const key = groupFunc(v);
        const s = grouped.get(key) ?? new Set([]);
        grouped.set(key, new Set([...s, v]));
    });
    return grouped;
}
exports.groupBy = groupBy;
function countNestedMapItems(map) {
    return [...map.values()].reduce((acc, curr) => acc + curr.size, 0);
}
exports.countNestedMapItems = countNestedMapItems;
function bigintToTwosComplement(val, width) {
    if (val >= 0n) {
        // Non-negative values just need to be truncated to the given bitWidth
        const bits = val.toString(2);
        return BigInt(`0b${bits.slice(-width)}`);
    }
    else {
        // Negative values need to be converted to two's complement
        // This is done by flipping the bits, adding one, and truncating
        const absBits = (-val).toString(2);
        const allBits = `${'0'.repeat(Math.max(width - absBits.length, 0))}${absBits}`;
        const inverted = `0b${[...allBits].map((c) => (c === '0' ? '1' : '0')).join('')}`;
        const twosComplement = (BigInt(inverted) + 1n).toString(2).slice(-width);
        return BigInt(`0b${twosComplement}`);
    }
}
exports.bigintToTwosComplement = bigintToTwosComplement;
function narrowBigInt(n) {
    const narrowed = parseInt(n.toString());
    if (BigInt(narrowed) !== n)
        return null;
    return narrowed;
}
exports.narrowBigInt = narrowBigInt;
function narrowBigIntSafe(n, errorMessage) {
    const narrowed = narrowBigInt(n);
    if (narrowed === null) {
        throw new errors_1.WillNotSupportError(errorMessage ?? `Unable to accurately parse ${n.toString()}`);
    }
    return narrowed;
}
exports.narrowBigIntSafe = narrowBigIntSafe;
function isCairoConstant(node) {
    if (node.mutability === solc_typed_ast_1.Mutability.Constant && node.vValue instanceof solc_typed_ast_1.Literal) {
        if (node.vType instanceof solc_typed_ast_1.ElementaryTypeName) {
            return primitiveTypeToCairo(node.vType.name) === 'felt';
        }
    }
    return false;
}
exports.isCairoConstant = isCairoConstant;
function isExternallyVisible(node) {
    return (node.visibility === solc_typed_ast_1.FunctionVisibility.External || node.visibility === solc_typed_ast_1.FunctionVisibility.Public);
}
exports.isExternallyVisible = isExternallyVisible;
function toSingleExpression(expressions, ast) {
    if (expressions.length === 1)
        return expressions[0];
    return new solc_typed_ast_1.TupleExpression(ast.reserveId(), '', `tuple(${expressions.map((e) => e.typeString).join(',')})`, false, // isInlineArray
    expressions);
}
exports.toSingleExpression = toSingleExpression;
function isNameless(node) {
    return [solc_typed_ast_1.FunctionKind.Constructor, solc_typed_ast_1.FunctionKind.Fallback, solc_typed_ast_1.FunctionKind.Receive].includes(node.kind);
}
exports.isNameless = isNameless;
function splitDarray(scope, dArrayVarDecl, ast) {
    (0, assert_1.default)(dArrayVarDecl.vType !== undefined);
    const arrayLen = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', true, // constant
    false, // indexed
    dArrayVarDecl.name + '_len', scope, false, // isInlineArray
    solc_typed_ast_1.DataLocation.CallData, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Immutable, 'uint248', undefined, new solc_typed_ast_1.ElementaryTypeName(ast.reserveId(), '', 'uint248', 'uint248'), undefined);
    return [arrayLen, dArrayVarDecl];
}
exports.splitDarray = splitDarray;
function toUintOrFelt(value, nBits) {
    const val = bigintToTwosComplement(BigInt(value.toString()), nBits);
    if (nBits > 251) {
        const [high, low] = divmod(val, uint128);
        return [low, high];
    }
    else {
        return [val];
    }
}
exports.toUintOrFelt = toUintOrFelt;
function expressionHasSideEffects(node) {
    return ((node instanceof solc_typed_ast_1.FunctionCall && functionAffectsState(node)) ||
        node instanceof solc_typed_ast_1.Assignment ||
        node.children.some((child) => child instanceof solc_typed_ast_1.Expression && expressionHasSideEffects(child)));
}
exports.expressionHasSideEffects = expressionHasSideEffects;
function functionAffectsState(node) {
    const funcDef = node.vReferencedDeclaration;
    if (funcDef instanceof solc_typed_ast_1.FunctionDefinition) {
        return (funcDef.stateMutability !== solc_typed_ast_1.FunctionStateMutability.Pure &&
            funcDef.stateMutability !== solc_typed_ast_1.FunctionStateMutability.View);
    }
    return true;
}
exports.functionAffectsState = functionAffectsState;
function mangleStructName(structDef) {
    return `${structDef.name}_${web3_1.default.utils.sha3(structDef.canonicalName)?.slice(2, 10)}`;
}
exports.mangleStructName = mangleStructName;
function mangleOwnContractInterface(contractOrName) {
    const name = typeof contractOrName === 'string' ? contractOrName : contractOrName.name;
    return `${name}_interface`;
}
exports.mangleOwnContractInterface = mangleOwnContractInterface;
function isBlock(node) {
    return node instanceof solc_typed_ast_1.Block || node instanceof solc_typed_ast_1.UncheckedBlock;
}
exports.isBlock = isBlock;
function isExternalCall(node) {
    return (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition &&
        isExternallyVisible(node.vReferencedDeclaration));
}
exports.isExternalCall = isExternalCall;
// Detects when an identifier represents a memory dynamic arrays that's being treated as calldata
// (which only occurs when the memory dynamic array is the output of a cross contract call function)
function isExternalMemoryDynArray(node, inference) {
    const declaration = node.vReferencedDeclaration;
    if (!(declaration instanceof solc_typed_ast_1.VariableDeclaration) ||
        node.parent instanceof solc_typed_ast_1.IndexAccess ||
        node.parent instanceof solc_typed_ast_1.MemberAccess)
        return false;
    const declarationLocation = declaration.storageLocation;
    const [nodeType, typeLocation] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, inference));
    return ((0, nodeTypeProcessing_1.isDynamicArray)(nodeType) &&
        declarationLocation === solc_typed_ast_1.DataLocation.CallData &&
        typeLocation === solc_typed_ast_1.DataLocation.Memory);
}
exports.isExternalMemoryDynArray = isExternalMemoryDynArray;
// Detects when an identifier represents a calldata dynamic array in solidity
function isCalldataDynArrayStruct(node, inference) {
    return ((0, nodeTypeProcessing_1.isDynamicCallDataArray)((0, nodeTypeProcessing_1.safeGetNodeType)(node, inference)) &&
        ((node.getClosestParentByType(solc_typed_ast_1.Return) !== undefined &&
            node.getClosestParentByType(solc_typed_ast_1.IndexAccess) === undefined &&
            node.getClosestParentByType(solc_typed_ast_1.FunctionDefinition)?.visibility === solc_typed_ast_1.FunctionVisibility.External &&
            node.getClosestParentByType(solc_typed_ast_1.IndexAccess) === undefined &&
            node.getClosestParentByType(solc_typed_ast_1.MemberAccess) === undefined) ||
            (node.parent instanceof solc_typed_ast_1.FunctionCall &&
                // 'string_hash' function can not be user defined, due to mangling identifiers
                (isExternalCall(node.parent) || node.parent.vFunctionName === 'string_hash'))));
}
exports.isCalldataDynArrayStruct = isCalldataDynArrayStruct;
/**
 * Given a source file and some nodes, prints them
 * @param source solidity path to file
 * @param locations nodes source locations
 * @param highlightFunc function that highlight the nodes text locations
 * @param surroundingLines lines surrounding highlighted lines
 * @returns text with highlights
 */
function getSourceFromLocations(source, locations, highlightFunc, surroundingLines = 2) {
    // Sort locations
    locations.sort((s1, s2) => s1.offset - s2.offset);
    let textWalked = 0;
    let locIndex = 0;
    const lines = source.split('\n').reduce((lines, currentLine, lineNum) => {
        const maxWalk = textWalked + currentLine.length + 1;
        let marked = false;
        let newLine = `${lineNum}\t`;
        while (locIndex < locations.length && maxWalk >= locations[locIndex].offset) {
            // Mark the line as a highlighted line
            marked = true;
            const currentLocation = locations[locIndex];
            if (currentLocation.offset + currentLocation.length > maxWalk) {
                // Case when node source spans across multiple lines
                newLine =
                    newLine +
                        source.substring(textWalked, currentLocation.offset) +
                        highlightFunc(source.substring(currentLocation.offset, maxWalk));
                currentLocation.length = currentLocation.length - (maxWalk - currentLocation.offset);
                currentLocation.offset = maxWalk;
                textWalked = maxWalk;
                break;
            }
            else {
                // Case when node source is a substring of a line
                newLine =
                    newLine +
                        source.substring(textWalked, currentLocation.offset) +
                        highlightFunc(source.substring(currentLocation.offset, currentLocation.offset + currentLocation.length));
                locIndex += 1;
                textWalked = currentLocation.offset + currentLocation.length;
            }
        }
        newLine = newLine + source.substring(textWalked, maxWalk);
        textWalked = maxWalk;
        lines.push([newLine, marked]);
        return lines;
    }, new Array());
    let lastLineMarked = 0;
    const filteredLines = [];
    for (let index = 0; index < lines.length; index++) {
        const [, marked] = lines[index];
        if (!marked)
            continue;
        if (index - (lastLineMarked + surroundingLines) > surroundingLines) {
            filteredLines.push('\t................\n');
        }
        lastLineMarked = index;
        filteredLines.push(...lines
            .slice(index - surroundingLines > 0 ? index - surroundingLines : 0, index + surroundingLines)
            .map((l) => l[0])
            .filter((l) => !filteredLines.includes(l)));
    }
    return filteredLines.join('');
}
exports.getSourceFromLocations = getSourceFromLocations;
function runStarknetClassHash(filePath) {
    const warpVenvPrefix = `PATH=${path.resolve(__dirname, '..', '..', 'warp_venv', 'bin')}:$PATH`;
    const command = 'starknet-class-hash';
    try {
        return (0, child_process_1.execSync)(`${warpVenvPrefix} ${command} ${filePath}`).toString().trim();
    }
    catch (e) {
        throw new errors_1.TranspileFailedError(catchExecSyncError(e, command));
    }
}
exports.runStarknetClassHash = runStarknetClassHash;
function getContainingFunction(node) {
    const func = node.getClosestParentByType(solc_typed_ast_1.FunctionDefinition);
    (0, assert_1.default)(func !== undefined, `Unable to find containing function for ${(0, astPrinter_1.printNode)(node)}`);
    return func;
}
exports.getContainingFunction = getContainingFunction;
function getContainingSourceUnit(node) {
    if (node instanceof solc_typed_ast_1.SourceUnit) {
        return node;
    }
    const root = node.getClosestParentByType(solc_typed_ast_1.SourceUnit);
    (0, assert_1.default)(root !== undefined, `Unable to find root source unit for ${(0, astPrinter_1.printNode)(node)}`);
    return root;
}
exports.getContainingSourceUnit = getContainingSourceUnit;
exports.NODE_MODULES_MARKER = ['node_modules'];
function markerExists(files, markers) {
    return markers.some((marker) => {
        return files.some((file) => {
            return file === marker;
        });
    });
}
function traverseParent(directory, levels, markers) {
    const files = fs.readdirSync(directory);
    if (levels === 0) {
        return null;
    }
    else if (markerExists(files, markers)) {
        return directory;
    }
    else {
        return traverseParent(path.resolve(directory, '..'), levels - 1, markers);
    }
}
exports.traverseParent = traverseParent;
function traverseChildren(directory, levels, markers) {
    const files = fs.readdirSync(directory);
    if (levels === 0) {
        return null;
    }
    else if (markerExists(files, markers)) {
        return directory;
    }
    else {
        for (const file of files) {
            const child = path.join(directory, file);
            if (fs.statSync(child).isDirectory()) {
                const result = traverseChildren(child, levels - 1, markers);
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }
}
exports.traverseChildren = traverseChildren;
function defaultBasePathAndIncludePath() {
    const currentDirectory = process.cwd();
    const parentNodeModules = traverseParent(currentDirectory, 4, exports.NODE_MODULES_MARKER);
    if (parentNodeModules !== null) {
        return [currentDirectory, path.resolve(parentNodeModules, 'node_modules')];
    }
    const childNodeModules = traverseChildren(currentDirectory, 4, exports.NODE_MODULES_MARKER);
    if (childNodeModules !== null) {
        return [currentDirectory, path.resolve(childNodeModules, 'node_modules')];
    }
    return [null, null];
}
exports.defaultBasePathAndIncludePath = defaultBasePathAndIncludePath;
function execSyncAndLog(command, commandName) {
    try {
        const output = (0, child_process_1.execSync)(command, { encoding: 'utf8' });
        console.log(output);
    }
    catch (e) {
        (0, errors_1.logError)(catchExecSyncError(e, commandName));
    }
}
exports.execSyncAndLog = execSyncAndLog;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function catchExecSyncError(e, commandExecuted) {
    if (!(0, errors_1.instanceOfExecSyncError)(e)) {
        // If is not an error from the execSync instruction then it could be anything else, like call stack
        // limit exceed. In those unpredicted cases we should stop and throw the error.
        throw e;
    }
    const error = hintForCommandFailed(commandExecuted, e.stderr.toString());
    return error;
}
exports.catchExecSyncError = catchExecSyncError;
function hintForCommandFailed(command, err) {
    if (err.includes('command not found')) {
        return `'${command}' command not found.
  Please make sure you have the required version of Warp dependencies by executing 'warp install' command.
  See more about it using 'warp install --help'.`;
    }
    return err;
}
//# sourceMappingURL=utils.js.map