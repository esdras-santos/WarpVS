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
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodePath = exports.createImport = void 0;
const cairoNodes_1 = require("../ast/cairoNodes");
const errors_1 = require("../utils/errors");
const gatherWarplibImports_1 = require("../warplib/gatherWarplibImports");
const functionGeneration_1 = require("./functionGeneration");
const utils_1 = require("./utils");
const Paths = __importStar(require("./importPaths"));
function createImport(path, name, nodeInSourceUnit, ast, inputs, outputs, options) {
    const sourceUnit = (0, utils_1.getContainingSourceUnit)(nodeInSourceUnit);
    const existingImport = findExistingImport(name, sourceUnit);
    if (existingImport !== undefined) {
        const hasInputs = inputs !== undefined && inputs.length > 0;
        const hasOutputs = outputs !== undefined && outputs.length > 0;
        if (!hasInputs || !hasOutputs)
            return existingImport;
        return (0, functionGeneration_1.createCairoImportFunctionDefinition)(name, path, existingImport.implicits, inputs, outputs, ast, sourceUnit, options);
    }
    const createFuncImport = (...implicits) => (0, functionGeneration_1.createCairoImportFunctionDefinition)(name, path, new Set(implicits), inputs ?? [], outputs ?? [], ast, sourceUnit, options);
    const createStructImport = () => (0, functionGeneration_1.createCairoImportStructDefinition)(name, path, ast, sourceUnit);
    const warplibFunc = gatherWarplibImports_1.warplibImportInfo.get(encodePath(path))?.get(name);
    if (warplibFunc !== undefined) {
        return createFuncImport(...warplibFunc);
    }
    const pathForStructImport = [
        Paths.U8_FROM_FELT,
        Paths.U16_FROM_FELT,
        Paths.U24_FROM_FELT,
        Paths.U32_FROM_FELT,
        Paths.U40_FROM_FELT,
        Paths.U48_FROM_FELT,
        Paths.U56_FROM_FELT,
        Paths.U64_FROM_FELT,
        Paths.U72_FROM_FELT,
        Paths.U80_FROM_FELT,
        Paths.U88_FROM_FELT,
        Paths.U96_FROM_FELT,
        Paths.U104_FROM_FELT,
        Paths.U112_FROM_FELT,
        Paths.U120_FROM_FELT,
        Paths.U128_FROM_FELT,
        Paths.U136_FROM_FELT,
        Paths.U144_FROM_FELT,
        Paths.U152_FROM_FELT,
        Paths.U160_FROM_FELT,
        Paths.U168_FROM_FELT,
        Paths.U176_FROM_FELT,
        Paths.U184_FROM_FELT,
        Paths.U192_FROM_FELT,
        Paths.U200_FROM_FELT,
        Paths.U208_FROM_FELT,
        Paths.U216_FROM_FELT,
        Paths.U224_FROM_FELT,
        Paths.U232_FROM_FELT,
        Paths.U240_FROM_FELT,
        Paths.U248_FROM_FELT,
    ];
    if (pathForStructImport.some((i) => encodePath([path, name]) === encodePath(i))) {
        return createStructImport();
    }
    const pathsForFunctionImport = [
        Paths.DEPLOY,
        Paths.EMIT_EVENT,
        Paths.GET_CALLER_ADDRESS,
        Paths.GET_CONTRACT_ADDRESS,
        Paths.INTO,
        Paths.CONTRACT_ADDRESS,
        Paths.U8_TO_FELT,
        Paths.U16_TO_FELT,
        Paths.U24_TO_FELT,
        Paths.U32_TO_FELT,
        Paths.U40_TO_FELT,
        Paths.U48_TO_FELT,
        Paths.U56_TO_FELT,
        Paths.U64_TO_FELT,
        Paths.U72_TO_FELT,
        Paths.U80_TO_FELT,
        Paths.U88_TO_FELT,
        Paths.U96_TO_FELT,
        Paths.U104_TO_FELT,
        Paths.U112_TO_FELT,
        Paths.U120_TO_FELT,
        Paths.U128_TO_FELT,
        Paths.U136_TO_FELT,
        Paths.U144_TO_FELT,
        Paths.U152_TO_FELT,
        Paths.U160_TO_FELT,
        Paths.U168_TO_FELT,
        Paths.U176_TO_FELT,
        Paths.U184_TO_FELT,
        Paths.U192_TO_FELT,
        Paths.U200_TO_FELT,
        Paths.U208_TO_FELT,
        Paths.U216_TO_FELT,
        Paths.U224_TO_FELT,
        Paths.U232_TO_FELT,
        Paths.U240_TO_FELT,
        Paths.U248_TO_FELT,
        Paths.U256_FROM_FELTS,
        Paths.ARRAY,
        Paths.ARRAY_TRAIT,
        Paths.WARP_MEMORY,
        Paths.MEMORY_TRAIT,
        Paths.BOOL_INTO_FELT252,
        Paths.FELT252_INTO_BOOL,
        Paths.U8_OVERFLOW_ADD,
        Paths.U8_OVERFLOW_SUB,
        Paths.U16_OVERFLOW_ADD,
        Paths.U16_OVERFLOW_SUB,
        Paths.U32_OVERFLOW_ADD,
        Paths.U32_OVERFLOW_SUB,
        Paths.U64_OVERFLOW_ADD,
        Paths.U64_OVERFLOW_SUB,
        Paths.U128_OVERFLOW_ADD,
        Paths.U128_OVERFLOW_SUB,
        Paths.U256_OVERFLOW_ADD,
        Paths.U256_OVERFLOW_SUB,
    ];
    if (pathsForFunctionImport.some((i) => encodePath([path, name]) === encodePath(i))) {
        return createFuncImport();
    }
    throw new errors_1.TranspileFailedError(`Import ${name} from ${path} is not defined.`);
}
exports.createImport = createImport;
function findExistingImport(name, node) {
    const found = node.vFunctions.filter((n) => n instanceof cairoNodes_1.CairoImportFunctionDefinition && n.name === name);
    return found[0];
}
function encodePath(path) {
    return path.flat().join('/');
}
exports.encodePath = encodePath;
//# sourceMappingURL=importFuncGenerator.js.map