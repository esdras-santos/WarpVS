"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeComplex = exports.decode_ = exports.decodeOutputs = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const utils_2 = require("./utils");
async function decodeOutputs(filePath, func, rawOutputs) {
    const solABI = (0, utils_2.parseSolAbi)(filePath);
    const funcSignature = await (0, utils_2.selectSignature)(solABI, func);
    const outputNodes = utils_1.FunctionFragment.fromObject(funcSignature).outputs ?? [];
    const outputs = rawOutputs ?? [];
    return decode_(outputNodes, outputs.values());
}
exports.decodeOutputs = decodeOutputs;
function decode_(types, outputs) {
    return types.map((ty) => {
        if ((0, utils_2.isPrimitiveParam)(ty)) {
            return decodePrimitive(ty.baseType, outputs);
        }
        else {
            return decodeComplex(ty, outputs);
        }
    });
}
exports.decode_ = decode_;
function decodePrimitive(typeString, outputs) {
    if (typeString.startsWith('uint')) {
        return decodeUint(typeString.length > 4 ? parseInt(typeString.slice(4), 10) : 256, outputs);
    }
    if (typeString.startsWith('int')) {
        return decodeInt(typeString.length > 3 ? parseInt(typeString.slice(3), 10) : 256, outputs);
    }
    if (typeString === 'address') {
        return (0, utils_2.normalizeAddress)(`0x${readFelt(outputs).toString(16)}`);
    }
    if (typeString === 'bool') {
        return readFelt(outputs) === 0n ? false : true;
    }
    if (typeString === 'fixed' || typeString === 'ufixed') {
        throw new Error('Not Supported');
    }
    if (typeString.startsWith('bytes')) {
        return typeString.length === 5
            ? decodeBytes(outputs)
            : decodeFixedBytes(outputs, parseInt(typeString.slice(5)));
    }
    // Todo make pretty
    throw new Error(`Can't decode type ${typeString}`);
}
function readFelt(outputs) {
    return BigInt((0, utils_2.safeNext)(outputs));
}
function useNumberIfSafe(n, width) {
    return width <= 48 ? Number(n) : ethers_1.BigNumber.from(n);
}
function readUint(outputs) {
    const low = BigInt((0, utils_2.safeNext)(outputs));
    const high = BigInt((0, utils_2.safeNext)(outputs));
    return (high << 128n) + low;
}
function decodeUint(nbits, outputs) {
    return useNumberIfSafe(nbits < 256 ? readFelt(outputs) : readUint(outputs), nbits);
}
function decodeInt(nbits, outputs) {
    return useNumberIfSafe((0, utils_2.twosComplementToBigInt)(nbits < 256 ? BigInt(readFelt(outputs)) : readUint(outputs), nbits), nbits);
}
function decodeBytes(outputs) {
    const len = readFelt(outputs);
    let result = 0n;
    for (let i = 0; i < len; i++) {
        result << 8n;
        result += BigInt(readFelt(outputs));
    }
    return result;
}
function decodeFixedBytes(outputs, length) {
    return useNumberIfSafe(length < 32 ? readFelt(outputs) : readUint(outputs), length * 8);
}
function decodeComplex(type, outputs) {
    if (type.arrayLength) {
        // array type
        const length = type.arrayLength === -1 ? readFelt(outputs) : type.arrayLength;
        const result = [];
        for (let i = 0; i < length; ++i) {
            result.push(decode_([type.arrayChildren], outputs)[0]);
        }
        return result;
    }
    else if (type.components !== null) {
        // struct type
        const indexedMembers = type.components.map((m) => decode_([m], outputs));
        const namedMembers = {};
        type.components.forEach((member, i) => {
            namedMembers[member.name] = indexedMembers[i];
        });
        return { ...namedMembers, ...indexedMembers };
    }
    throw Error(`Complex type not supported ${type.type}`);
}
exports.decodeComplex = decodeComplex;
//# sourceMappingURL=decode.js.map