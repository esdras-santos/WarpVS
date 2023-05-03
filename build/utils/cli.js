"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClassHash = exports.createPassMap = exports.parsePassOrder = void 0;
const assert_1 = __importDefault(require("assert"));
const commander_1 = require("commander");
const errors_1 = require("./errors");
const formatting_1 = require("./formatting");
class PassOrderParseError extends commander_1.InvalidArgumentError {
    constructor(passOrder, remainingPassOrder, validOptions) {
        const errorMessage = `Unable to parse options ${remainingPassOrder} of ${passOrder}`;
        const validOptionList = `Valid options are ${validOptions.join()}`;
        const example = `For example, --order ${validOptions.join('')}`;
        super((0, formatting_1.error)(`${errorMessage}\n${validOptionList}\n${example}`));
    }
}
function parsePassOrder(order, until, warnings, dev, passes) {
    if (order === undefined) {
        order = [...passes.keys()].reduce((acc, key) => `${acc}${key}`, '');
    }
    //We want keys in order of longest first otherwise 'Vs' would match 'V' and then error on 's'
    const sortedPassMap = [...passes.entries()].sort(([a], [b]) => b.length - a.length);
    const passesInOrder = [];
    const keyPassesInOrder = [];
    let remainingOrder = order;
    while (remainingOrder.length > 0) {
        const foundPass = sortedPassMap.find(([key]) => remainingOrder.startsWith(key));
        if (foundPass === undefined) {
            throw new PassOrderParseError(remainingOrder, order, [...passes.keys()]);
        }
        const [key, nextPass] = foundPass;
        passesInOrder.push(nextPass);
        keyPassesInOrder.push(key);
        if (key === until)
            break;
        remainingOrder = remainingOrder.slice(key.length);
    }
    passesInOrder.forEach((element, index) => {
        const prerequisite = element._getPassPrerequisites();
        const earlierPassKeys = [...keyPassesInOrder].slice(0, index);
        prerequisite.forEach((prerequisite) => {
            if (!passes.get(prerequisite)) {
                throw new Error(`Unknown pass key: ${prerequisite} in pass prerequisite of ${element.getPassName()}`);
            }
            if (!earlierPassKeys.includes(prerequisite)) {
                if (warnings && dev) {
                    console.log(`WARNING: ${passes
                        .get(prerequisite)
                        ?.getPassName()} pass is not before ${element.getPassName()} in the pass order`);
                }
                if (!dev) {
                    throw new errors_1.PassOrderError(`${passes
                        .get(prerequisite)
                        ?.getPassName()} pass is not before ${element.getPassName()} in the pass order`);
                }
            }
        });
    });
    return passesInOrder;
}
exports.parsePassOrder = parsePassOrder;
function createPassMap(passes) {
    // By asserting that each key is the first one like it, we ensure that each key is unique
    (0, assert_1.default)(passes.every(([key], index) => passes.findIndex(([k]) => k === key) === index));
    (0, assert_1.default)(passes.every(([key]) => isCorrectCase(key)));
    return new Map(passes);
}
exports.createPassMap = createPassMap;
function isCorrectCase(key) {
    return [...key].every((letter, index) => index === 0 ? letter >= 'A' && letter <= 'Z' : letter >= 'a' || letter <= 'z');
}
function parseClassHash(filePath, CLIOutput) {
    const splitter = new RegExp('[ ]+');
    const classHash = CLIOutput.split('\n')
        .map((line) => {
        const [contractT, classT, hashT, hash, ...others] = line.split(splitter);
        if (contractT === 'Contract' && classT === 'class' && hashT === 'hash:') {
            if (others.length !== 0) {
                throw new errors_1.CLIError(`Error while parsing the 'declare' output of ${filePath}. Malformed lined.`);
            }
            return hash;
        }
        return null;
    })
        .filter((val) => val !== null)[0];
    if (classHash === null || classHash === undefined)
        throw new errors_1.CLIError(`Error while parsing the 'declare' output of ${filePath}. Couldn't find the class hash.`);
    return classHash;
}
exports.parseClassHash = parseClassHash;
//# sourceMappingURL=cli.js.map