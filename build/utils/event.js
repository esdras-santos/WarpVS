"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warpEventSignatureHash256FromString = exports.warpEventCanonicalSignaturehash256 = exports.join248bitChunks = exports.splitInto248BitChunks = void 0;
const keccak_1 = __importDefault(require("keccak"));
const export_1 = require("./export");
function splitInto248BitChunks(data) {
    if (data.startsWith('0x'))
        data = data.slice(2);
    if (data === '')
        return [];
    const paddedData = data.padEnd(data.length + (62 - (data.length % 62)), '0');
    const result = [];
    // get number from every 62 hex digits chunk
    for (let i = 0; i < paddedData.length; i += 62) {
        result.push(BigInt(`0x${paddedData.slice(i, i + 62)}`).toString());
    }
    return result;
}
exports.splitInto248BitChunks = splitInto248BitChunks;
function join248bitChunks(data) {
    // numbers to hex in 248 bits
    const numberToHex248 = (num) => {
        return `${BigInt(num).toString(16).padStart(62, '0')}`;
    };
    // decode number from raw hex input string
    const decode248BitEncoding = (hexArray) => {
        const rawHex = hexArray.map(numberToHex248).join('');
        // pad '0' to the end of the string to make it a multiple of 64
        const paddedHexVals = rawHex.padEnd(rawHex.length + (64 - (rawHex.length % 64)), '0');
        // get number from every 64 hex digits chunk
        const result = [];
        for (let i = 0; i < paddedHexVals.length; i += 64) {
            result.push(BigInt(`0x${paddedHexVals.slice(i, i + 64)}`));
        }
        //remove trailing zero
        if (paddedHexVals.length !== rawHex.length && result[result.length - 1] === 0n) {
            result.pop();
        }
        return result;
    };
    return decode248BitEncoding(data).map((num) => `0x${num.toString(16).padStart(64, '0')}`);
}
exports.join248bitChunks = join248bitChunks;
// NOTE: argTypes must not contain `uint` , it should be `uint256` instead
function warpEventCanonicalSignaturehash256(eventName, argTypes) {
    const getArgStringRepresentation = (arg) => {
        if (typeof arg === 'string')
            return arg;
        return `(${arg.map(getArgStringRepresentation).join(',')})`;
    };
    const funcSignature = `${eventName}(${argTypes.map(getArgStringRepresentation).join(',')})`;
    return warpEventSignatureHash256FromString(funcSignature);
}
exports.warpEventCanonicalSignaturehash256 = warpEventCanonicalSignaturehash256;
// NOTE: argTypes must not contain `uint` , it should be `uint256` instead
function warpEventSignatureHash256FromString(functionSignature) {
    const funcSignatureHash = (0, keccak_1.default)('keccak256').update(functionSignature).digest('hex');
    const [low, high] = (0, export_1.toUintOrFelt)(BigInt(`0x${funcSignatureHash}`), 256);
    return {
        low: `0x${low.toString(16)}`,
        high: `0x${high.toString(16)}`,
    };
}
exports.warpEventSignatureHash256FromString = warpEventSignatureHash256FromString;
//# sourceMappingURL=event.js.map