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
exports.compileSolFilesAndExtractContracts = exports.compileSolFiles = void 0;
const assert_1 = __importDefault(require("assert"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const solc_typed_ast_1 = require("solc-typed-ast");
const ast_1 = require("./ast/ast");
const nethersolc_1 = require("./nethersolc");
const errors_1 = require("./utils/errors");
const formatting_1 = require("./utils/formatting");
// For contracts of a reasonable size the json representation of the
// AST was exceeding the buffer size. We leave it unbounded by setting the
// size to the largest possible
const MAX_BUFFER_SIZE = Number.MAX_SAFE_INTEGER;
function compileSolFilesCommon(files, options) {
    const sources = files.map((file) => {
        return getSolFileVersion(file);
    });
    sources.forEach((version, i) => {
        const [, majorVersion] = matchCompilerVersion(version);
        if (majorVersion !== '7' && majorVersion !== '8') {
            throw new errors_1.TranspileFailedError(`Unsupported version of solidity source ${version} in file ${files[i]}`);
        }
    });
    if (!sources.every((version) => version === sources[0])) {
        throw new errors_1.TranspileFailedError(`All solidity files should be the same major version`);
    }
    const solcOutput = cliCompile(formatInput(files), sources[0], options);
    return solcOutput;
}
function compileSolFiles(files, options) {
    const solcOutput = compileSolFilesCommon(files, options);
    printErrors(solcOutput.result, options.warnings || false, solcOutput.compilerVersion);
    const reader = new solc_typed_ast_1.ASTReader();
    const sourceUnits = reader.read(solcOutput.result);
    return new ast_1.AST(sourceUnits, solcOutput.compilerVersion, solcOutput.result);
}
exports.compileSolFiles = compileSolFiles;
const supportedVersions = ['0.8.14', '0.7.6'];
function getSolFileVersion(file) {
    const content = fs.readFileSync(file, { encoding: 'utf-8' });
    const pragma = (0, solc_typed_ast_1.extractSpecifiersFromSource)(content);
    const retrievedVersions = (0, solc_typed_ast_1.getCompilerVersionsBySpecifiers)(pragma, supportedVersions);
    const version = retrievedVersions.length !== 0 ? retrievedVersions.sort().reverse()[0] : supportedVersions[0];
    return version;
}
function formatInput(fileNames) {
    const sources = {};
    fileNames.forEach((fileName) => {
        sources[fileName] = {
            urls: [fileName],
        };
    });
    return {
        language: 'Solidity',
        sources,
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi'],
                    '': ['ast'],
                },
            },
        },
    };
}
function cliCompile(input, solcVersion, options) {
    // Determine compiler version to use
    const nethersolcVersion = solcVersion.startsWith('0.7.') ? `7` : `8`;
    const solcCommand = (0, nethersolc_1.nethersolcPath)(nethersolcVersion);
    let allowedPaths = '';
    // Check if compiler version used is v0.7.6
    // For solc v0.8.7 and before, we need to set the allow path.
    // Since we are using latest version of v0.8.x, we do not need to set allow path
    // for v0.8.x contracts.
    if (nethersolcVersion === '7') {
        const currentDirectory = (0, child_process_1.execSync)(`pwd`).toString().replace('\n', '');
        allowedPaths = `--allow-paths ${currentDirectory}`;
    }
    const includePathOptions = options?.includePaths === undefined || nethersolcVersion === '7'
        ? ``
        : `--include-path ${options.includePaths.join(' --include-path ')}`;
    const basePathOption = options?.basePath === undefined ? `` : `--base-path ${options.basePath}`;
    const commandOptions = `--standard-json ${allowedPaths} ${basePathOption} ${includePathOptions}`;
    return {
        result: JSON.parse((0, child_process_1.execSync)(`${solcCommand} ${commandOptions}`, {
            input: JSON.stringify(input),
            maxBuffer: MAX_BUFFER_SIZE,
            stdio: ['pipe', 'pipe', 'ignore'],
        }).toString()),
        compilerVersion: (0, nethersolc_1.fullVersionFromMajor)(nethersolcVersion),
    };
}
function matchCompilerVersion(version) {
    const pattern = /([0-9]+)\.([0-9]+)\.([0-9]+)/;
    const match = pattern.exec(version);
    if (match === null) {
        throw new errors_1.TranspileFailedError(`Unable to extract version number from "${version}"`);
    }
    return [match[1], match[2], match[3]];
}
function printErrors(cliOutput, printWarnings, compilerVersion) {
    (0, assert_1.default)(typeof cliOutput === 'object' && cliOutput !== null, (0, formatting_1.error)(`Obtained unexpected output from solc: ${cliOutput}`));
    const errorsAndWarnings = Object.entries(cliOutput).find(([propName]) => propName === 'errors')?.[1];
    if (errorsAndWarnings === undefined)
        return;
    (0, assert_1.default)(errorsAndWarnings instanceof Array, (0, formatting_1.error)(`Solc error output of unexpected type. ${errorsAndWarnings}`));
    // This also includes output of type info
    const warnings = errorsAndWarnings.filter((data) => data.severity !== 'error');
    if (warnings.length !== 0 && printWarnings) {
        console.log('---Solc warnings:');
        warnings.forEach((warningData) => {
            if (warningData.formattedMessage !== undefined) {
                console.log(warningData.formattedMessage);
                return;
            }
            else {
                console.log(warningData);
            }
            console.log('-');
        });
        console.log('---');
    }
    const errors = errorsAndWarnings.filter((data) => data.severity === 'error');
    if (errors.length !== 0) {
        throw new solc_typed_ast_1.CompileFailedError([
            {
                errors: errors.map((error) => error.formattedMessage ?? error(`${error.type}: ${error.message}`)),
                compilerVersion,
            },
        ]);
    }
}
// used for the semantic test suite
function compileSolFilesAndExtractContracts(file) {
    const requiredSolcVersion = getSolFileVersion(file);
    const [, majorVersion] = matchCompilerVersion(requiredSolcVersion);
    if (majorVersion !== '7' && majorVersion !== '8') {
        throw new errors_1.TranspileFailedError(`Unsupported version of solidity source ${requiredSolcVersion}`);
    }
    const solcOutput = cliCompile(formatInput([file]), requiredSolcVersion);
    (0, assert_1.default)(typeof solcOutput.result === 'object' && solcOutput.result !== null);
    return Object.entries(solcOutput.result).filter(([name]) => name === 'contracts')[0][1][file];
}
exports.compileSolFilesAndExtractContracts = compileSolFilesAndExtractContracts;
//# sourceMappingURL=solCompile.js.map