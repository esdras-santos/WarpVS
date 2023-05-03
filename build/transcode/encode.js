"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeAsUintOrFelt = exports.makeIterator = exports.encodeComplex = exports.encode_ = exports.encodeParams = exports.encode = exports.encodeInputs = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const bignumber_1 = require("@ethersproject/bignumber/lib/bignumber");
const utils_2 = require("./utils");
const web3_1 = __importDefault(require("web3"));
async function encodeInputs(filePath, func, useCairoABI, rawInputs) {
    if (useCairoABI) {
        const inputs = rawInputs ? `${rawInputs.join(' ').split(',').join(' ')}` : '';
        return [func, inputs];
    }
    const solABI = (0, utils_2.parseSolAbi)(filePath);
    const funcSignature = await (0, utils_2.selectSignature)(solABI, func);
    let funcName = func;
    // If function type is not constructor then append the EVM function selector to the function name
    if (funcSignature.type === 'function') {
        const selector = new web3_1.default().utils
            .keccak256(`${funcSignature['name']}(${funcSignature['inputs'].map((i) => i['type']).join(',')})`)
            .substring(2, 10);
        funcName = `${func}_${selector}`;
    }
    const inputNodes = funcSignature.inputs.map(utils_1.ParamType.fromObject);
    const encodedInputs = encode(inputNodes, rawInputs ?? []);
    const inputs = rawInputs ? `${encodedInputs.join(' ')}` : '';
    return [funcName, inputs];
}
exports.encodeInputs = encodeInputs;
function encode(types, inputs) {
    return encodeParams(types, makeIterator(inputs));
}
exports.encode = encode;
function encodeParams(types, inputs) {
    return types.flatMap((ty) => encode_(ty, inputs));
}
exports.encodeParams = encodeParams;
function encode_(type, inputs) {
    if ((0, utils_2.isPrimitiveParam)(type)) {
        return encodePrimitive(type.type, inputs);
    }
    else {
        return encodeComplex(type, inputs);
    }
}
exports.encode_ = encode_;
function encodePrimitive(typeString, inputs) {
    if (typeString.startsWith('uint')) {
        return encodeAsUintOrFelt(typeString, inputs, parseInt(typeString.slice(4), 10));
    }
    if (typeString.startsWith('int')) {
        return encodeAsUintOrFelt(typeString, inputs, parseInt(typeString.slice(3), 10));
    }
    if (typeString === 'address') {
        return encodeAsUintOrFelt(typeString, inputs, 251);
    }
    if (typeString === 'bool') {
        const value = (0, utils_2.safeNext)(inputs);
        if (typeof value === 'boolean') {
            return value ? ['1'] : ['0'];
        }
        if (typeof value === 'string') {
            if (value === 'true' || value === 'false')
                return value === 'true' ? ['1'] : ['0'];
            if (value === '1' || value === '0')
                return [value];
        }
        throw new Error(`Cannot encode ${value} as a boolean value. Expected 'true' or 'false'`);
    }
    if (typeString === 'fixed' || typeString === 'ufixed') {
        throw new Error('Fixed types not supported by Warp');
    }
    if (/bytes\d+$/.test(typeString)) {
        const nbits = parseInt(typeString.slice(5), 10) * 8;
        return encodeAsUintOrFelt(typeString, inputs, nbits);
    }
    if (typeString === 'bytes') {
        const value = (0, utils_2.safeNext)(inputs);
        if (typeof value === 'string') {
            // remove 0x
            const bytes = value.substring(2);
            if (bytes.length % 2 !== 0)
                throw new Error('Bytes must have even length');
            const cairoBytes = [];
            for (let index = 0; index < bytes.length; index += 2) {
                const byte = bytes.substring(index, index + 2);
                cairoBytes.push(`0x${byte}`);
            }
            return [...cairoBytes].flat();
        }
        else if ((0, utils_1.isBytes)(value)) {
            if (value.length % 2 !== 0)
                throw new Error('Bytes must have even length');
            return Array.from(value).map((byte) => byte.toString());
        }
        throw new Error(`Can't encode ${value} as bytes`);
    }
    if (typeString === 'string') {
        const value = (0, utils_2.safeNext)(inputs);
        if (typeof value === 'string') {
            return [
                value.length.toString(),
                ...Buffer.from(value)
                    .toJSON()
                    .data.map((v) => v.toString()),
            ];
        }
        throw new Error(`Can't encode ${value} as string`);
    }
    throw new Error(`Failed to encode type ${typeString}`);
}
function encodeComplex(type, inputs) {
    const value = (0, utils_2.safeNext)(inputs);
    if (type.baseType === 'array') {
        if (!Array.isArray(value)) {
            throw new Error(`Array must be of array type`);
        }
        // array type
        const length = type.arrayLength === -1 ? [value.length.toString()] : [];
        return [...length, ...value.flatMap((val) => encode_(type.arrayChildren, makeIterator([val])))];
    }
    else if (type.baseType === 'tuple') {
        if (typeof value !== 'object') {
            throw new Error('Expected Object input for transcoding struct types');
        }
        const tupleValues = value;
        const keys = new Set(Object.keys(tupleValues));
        const encoding = type.components.flatMap((type) => {
            if (!keys.has(type.name)) {
                throw new Error(`Unknown struct member: ${type.name}`);
            }
            keys.delete(type.name);
            return encode_(type, makeIterator(tupleValues[type.name]));
        });
        if (keys.size !== 0) {
            throw new Error(`Some struct properties where not specified: ${[...keys.values()].join(', ')}`);
        }
        return encoding;
    }
    throw new Error(`Can't encode complex type ${type}`);
}
exports.encodeComplex = encodeComplex;
function makeIterator(value) {
    if (Array.isArray(value)) {
        return value.values();
    }
    return [value].values();
}
exports.makeIterator = makeIterator;
function encodeAsUintOrFelt(tp, inputs, nbits) {
    const value = (0, utils_2.safeNext)(inputs);
    if ((0, bignumber_1.isBigNumberish)(value)) {
        return (0, utils_2.toUintOrFelt)(ethers_1.BigNumber.from(value).toBigInt(), nbits).map((x) => x.toString());
    }
    throw new Error(`Can't encode ${value} as ${tp}`);
}
exports.encodeAsUintOrFelt = encodeAsUintOrFelt;
//# sourceMappingURL=encode.js.map