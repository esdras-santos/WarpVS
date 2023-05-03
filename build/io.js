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
exports.outputResult = exports.replaceSuffix = exports.findAllFiles = exports.findCairoSourceFilePaths = exports.findSolSourceFilePaths = exports.isValidSolFile = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const errors_1 = require("./utils/errors");
const fs_1 = require("./utils/fs");
function isValidSolFile(path, printError = true) {
    if (!fs.existsSync(path)) {
        if (printError)
            (0, errors_1.logError)(`${path} doesn't exist`);
        return false;
    }
    if (!fs.lstatSync(path).isFile()) {
        if (printError)
            (0, errors_1.logError)(`${path} is not a file`);
        return false;
    }
    if (!path.endsWith('.sol')) {
        if (printError)
            (0, errors_1.logError)(`${path} is not a solidity source file`);
        return false;
    }
    return true;
}
exports.isValidSolFile = isValidSolFile;
function findSolSourceFilePaths(targetPath, recurse) {
    return findAllFiles(targetPath, recurse).filter((path) => path.endsWith('.sol'));
}
exports.findSolSourceFilePaths = findSolSourceFilePaths;
function findCairoSourceFilePaths(targetPath, recurse) {
    return findAllFiles(targetPath, recurse).filter((path) => path.endsWith('.cairo'));
}
exports.findCairoSourceFilePaths = findCairoSourceFilePaths;
function findAllFiles(targetPath, recurse) {
    const targetInformation = fs.lstatSync(targetPath);
    if (targetInformation.isDirectory()) {
        return evaluateDirectory(targetPath, recurse);
    }
    else if (targetInformation.isFile()) {
        return [targetPath];
    }
    else {
        console.log(`WARNING: Found ${targetPath}, which is neither a file nor directory`);
        return [];
    }
}
exports.findAllFiles = findAllFiles;
function evaluateDirectory(path, recurse) {
    return fs.readdirSync(path, { withFileTypes: true }).flatMap((dirEntry) => {
        if (!recurse && dirEntry.isDirectory()) {
            return [];
        }
        return findAllFiles(`${path}/${dirEntry.name}`, recurse);
    });
}
function replaceSuffix(filePath, suffix) {
    const parsedPath = path.parse(filePath);
    return path.join(parsedPath.dir, `${parsedPath.name}${suffix}`);
}
exports.replaceSuffix = replaceSuffix;
function outputResult(contractName, outputPath, code, options, ast) {
    if (options.outputDir !== undefined) {
        if (fs.existsSync(options.outputDir)) {
            const targetInformation = fs.lstatSync(options.outputDir);
            if (!targetInformation.isDirectory()) {
                throw new errors_1.TranspileFailedError(`Cannot output to ${options.outputDir}. Output-dir must be a directory`);
            }
        }
        const outputLocation = path.parse(path.join(options.outputDir, outputPath));
        const metadataLocation = path.dirname(outputLocation.dir);
        const abiOutPath = path.join(metadataLocation, `${outputLocation.name}_sol_abi.json`);
        const solFilePath = path.dirname(path.dirname(outputPath));
        (0, fs_1.outputFileSync)(abiOutPath, JSON.stringify(ast.solidityABI.contracts[solFilePath][contractName]['abi'], null, 2));
        const codeOutPath = path.join(outputLocation.dir, outputLocation.base);
        (0, fs_1.outputFileSync)(codeOutPath, code);
        // Cairo-format is disabled, as it has a bug
        // if (options.formatCairo || options.dev) {
        //   const warpVenvPrefix = `PATH=${path.resolve(__dirname, '..', 'warp_venv', 'bin')}:$PATH`;
        //   execSync(`${warpVenvPrefix} cairo-format -i ${fullCodeOutPath}`);
        // }
    }
    else {
        console.log(`//--- ${outputPath} ---\n${code}\n//---`);
    }
}
exports.outputResult = outputResult;
//# sourceMappingURL=io.js.map