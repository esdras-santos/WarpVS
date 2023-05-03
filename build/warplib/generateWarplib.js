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
const utils_1 = require("./utils");
const int_1 = require("./implementations/conversions/int");
const div_1 = require("./implementations/maths/div");
const exp_1 = require("./implementations/maths/exp");
const negate_1 = require("./implementations/maths/negate");
const shl_1 = require("./implementations/maths/shl");
const shr_1 = require("./implementations/maths/shr");
const bitwiseNot_1 = require("./implementations/maths/bitwiseNot");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const endent_1 = __importDefault(require("endent"));
const glob_1 = require("glob");
const cairoParsing_1 = require("../utils/cairoParsing");
const warplibFunctions = [
    (0, div_1.div_signed_unsafe)(),
    (0, exp_1.exp)(),
    (0, exp_1.exp_signed)(),
    (0, exp_1.exp_unsafe)(),
    (0, exp_1.exp_signed_unsafe)(),
    (0, negate_1.negate)(),
    (0, shl_1.shl)(),
    (0, shr_1.shr)(),
    (0, shr_1.shr_signed)(),
    // xor - handwritten
    // bitwise_and - handwritten
    // bitwise_or - handwritten
    (0, bitwiseNot_1.bitwise_not)(),
    // ---conversions---
    (0, int_1.int_conversions)(),
];
warplibFunctions.forEach((warpFunc) => (0, utils_1.generateFile)(warpFunc));
const mathsContent = glob_1.glob
    .sync(path_1.default.join(utils_1.PATH_TO_WARPLIB, 'maths', '*.cairo'))
    .map((pathToFile) => {
    const fileName = path_1.default.basename(pathToFile, '.cairo');
    const rawCairoCode = fs.readFileSync(pathToFile, { encoding: 'utf8' });
    const funcNames = (0, cairoParsing_1.parseMultipleRawCairoFunctions)(rawCairoCode).map(({ name }) => name);
    return { fileName, funcNames };
})
    // TODO: Remove this filter once all warplib modules use cairo1
    .filter(({ funcNames }) => funcNames.length > 0)
    .map(({ fileName, funcNames }) => {
    const useFuncNames = funcNames.map((name) => `use ${fileName}::${name};`).join('\n');
    return `mod ${fileName};\n${useFuncNames}`;
})
    .join('\n\n');
fs.writeFileSync(path_1.default.join(utils_1.PATH_TO_WARPLIB, 'maths.cairo'), (0, endent_1.default) `
    // AUTO-GENERATED
    ${mathsContent}
  `);
//# sourceMappingURL=generateWarplib.js.map