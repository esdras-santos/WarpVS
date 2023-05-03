"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRawCairoFunctionInfo = exports.parseMultipleRawCairoFunctions = void 0;
const assert_1 = __importDefault(require("assert"));
/**
 * Given several Cairo function represented in plain text extracts information from it
 *  @param rawFunctions Multiple cairo functions in a single text
 *  @returns A list of each function information
 */
function parseMultipleRawCairoFunctions(rawFunctions) {
    const functions = [...rawFunctions.matchAll(/#\[implicit\((.+)\)\](\s+)fn (\w+)|fn (\w+)/gis)];
    return [...functions].map((func) => getRawCairoFunctionInfo(func[0]));
}
exports.parseMultipleRawCairoFunctions = parseMultipleRawCairoFunctions;
/**
 * Given a Cairo function represented in plain text extracts information from it
 *  @param rawFunction Cairo code
 *  @returns The function implicits and it's name
 */
function getRawCairoFunctionInfo(rawFunction) {
    const funcSignature = rawFunction.match(/#\[implicit\((?<implicits>.+)\)\](\s+)fn (?<name>\w+)/) ??
        rawFunction.match(/fn (?<name>\w+)/);
    (0, assert_1.default)(funcSignature !== null && funcSignature.groups !== undefined, `Invalid parsing of raw string function:\n${rawFunction}`);
    const name = funcSignature.groups.name;
    const implicits = funcSignature.groups.implicits !== undefined ? ['warp_memory'] : [];
    return { name, implicits };
}
exports.getRawCairoFunctionInfo = getRawCairoFunctionInfo;
//# sourceMappingURL=cairoParsing.js.map