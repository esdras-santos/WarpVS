"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodedOutputsToString = exports.selectSignature = exports.parseSolAbi = exports.parseParam = exports.normalizeAddress = exports.safeNext = exports.twosComplementToBigInt = exports.bigintToTwosComplement = exports.toUintOrFelt = exports.isPrimitiveParam = exports.getWidthInFeltsOf = void 0;
const errors_1 = require("../utils/errors");
const fs_1 = require("fs");
const prompts_1 = __importDefault(require("prompts"));
const utils_1 = require("../utils/utils");
function getWidthInFeltsOf(type) {
    if (type.baseType.startsWith('uint')) {
        const width = parseInt(type.baseType.slice(4), 10);
        return width < 256 ? 1 : 2;
    }
    else if (type.baseType.startsWith('int')) {
        const width = parseInt(type.baseType.slice(3), 10);
        return width < 256 ? 1 : 2;
    }
    else if (type.baseType.startsWith('address')) {
        return 1;
    }
    else if (type.baseType.startsWith('bool')) {
        return 1;
    }
    else if (/bytes\d*$/.test(type.baseType)) {
        const width = parseInt(type.baseType.slice(4), 10);
        if (width === 32)
            return 2;
        return 1;
    }
    else if (type.baseType.startsWith('ufixed') || type.baseType.startsWith('fixed')) {
        throw new Error('Fixed types not supported by Warp');
    }
    else if (type.baseType.startsWith('bytes')) {
        throw new Error('Nested dynamic types not supported in Warp');
    }
    else if (type.indexed) {
        // array
        if (type.arrayLength === -1) {
            throw new Error('Nested dynamic types not supported in Warp');
        }
        else {
            // static array
            return type.arrayLength * getWidthInFeltsOf(type.arrayChildren);
        }
    }
    else if (type.components.length !== 0) {
        // struct
        return type.components.reduce((acc, ty) => {
            return acc + getWidthInFeltsOf(ty);
        }, 0);
    }
    throw new Error('Not Supported ' + type.baseType);
}
exports.getWidthInFeltsOf = getWidthInFeltsOf;
function isPrimitiveParam(type) {
    return type.arrayLength === null && type.components === null;
}
exports.isPrimitiveParam = isPrimitiveParam;
const uint128 = BigInt('0x100000000000000000000000000000000');
function toUintOrFelt(value, nBits) {
    const val = bigintToTwosComplement(BigInt(value.toString()), nBits);
    if (nBits > 251) {
        const [high, low] = (0, utils_1.divmod)(val, uint128);
        return [low, high];
    }
    else {
        return [val];
    }
}
exports.toUintOrFelt = toUintOrFelt;
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
function twosComplementToBigInt(val, width) {
    const mask = 2n ** BigInt(width) - 1n;
    const max = 2n ** BigInt(width - 1) - 1n;
    if (val > max) {
        // Negative number
        const pos = (val ^ mask) + 1n;
        return -pos;
    }
    else {
        // Positive numbers as are
        return val;
    }
}
exports.twosComplementToBigInt = twosComplementToBigInt;
function safeNext(iter) {
    const next = iter.next();
    if (!next.done) {
        return next.value;
    }
    throw new Error('Unexpected end of input in Solidity to Cairo encode');
}
exports.safeNext = safeNext;
function normalizeAddress(address) {
    // For some reason starknet-devnet does not zero pads their addresses
    // For some reason starknet zero pads their addresses
    return `0x${address.split('x')[1].padStart(64, '0')}`;
}
exports.normalizeAddress = normalizeAddress;
function parseParam(param) {
    try {
        const parsedParam = JSON.parse(`[${param}]`.replaceAll(/\b0x[0-9a-fA-F]+/g, (s) => `"${s}"`));
        validateParam(parsedParam);
        return parsedParam;
    }
    catch (e) {
        throw new errors_1.CLIError('Param must be a comma separated list of numbers, strings and lists');
    }
}
exports.parseParam = parseParam;
function validateParam(param) {
    if (param instanceof Array) {
        param.map(validateParam);
        return;
    }
    if (param instanceof String ||
        param instanceof Number ||
        typeof param === 'string' ||
        typeof param === 'number')
        return;
    throw new errors_1.CLIError('Input invalid');
}
function parseSolAbi(filePath) {
    const abiString = (0, fs_1.readFileSync)(filePath, 'utf-8');
    const solAbi = JSON.parse(abiString);
    return solAbi;
}
exports.parseSolAbi = parseSolAbi;
async function selectSignature(abi, funcName) {
    if (funcName === 'constructor') {
        // Item with abi[type] === 'constructor'
        const constructorsAbi = abi.filter((item) => item.type === 'constructor');
        if (constructorsAbi.length === 0) {
            // Solidity ABI has no constructor so enforce empty args for constructor in CLI
            return {
                inputs: [],
                stateMutability: 'view',
                type: 'constructor',
            };
        }
        if (constructorsAbi.length > 1) {
            throw new errors_1.CLIError('Multiple constructors found in abi');
        }
        return {
            type: 'function',
            inputs: constructorsAbi[0].inputs,
            outputs: [],
            stateMutability: constructorsAbi[0].stateMutability,
            name: 'constructor',
        };
    }
    const matchesWithoutConstructor = abi.filter((item) => item.type === 'function');
    const matches = matchesWithoutConstructor.filter((fs) => fs['name'] === funcName);
    if (!matches.length) {
        throw new errors_1.CLIError(`No function in abi with name ${funcName}`);
    }
    if (matches.length === 1)
        return matches[0];
    const choice = await (0, prompts_1.default)({
        type: 'select',
        name: 'func',
        message: `Multiple function definitions found for ${funcName}. Please select one now:`,
        choices: matches.map((func) => ({ title: func.name, value: func })),
    });
    return choice.func;
}
exports.selectSignature = selectSignature;
function decodedOutputsToString(outputs) {
    return outputs.map((output) => outputToString(output)).join(', ');
}
exports.decodedOutputsToString = decodedOutputsToString;
function outputToString(output) {
    if (Array.isArray(output))
        return `[ ${output.map((o) => outputToString(o)).join(', ')} ]`;
    else if (output.constructor === Object)
        // is a Struct
        return `{ ${Object.keys(output)
            .map((key) => outputToString(key) + ': ' + outputToString(output[key]))
            .join(', ')} }`;
    else
        return output.toString();
}
//# sourceMappingURL=utils.js.map