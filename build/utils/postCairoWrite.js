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
exports.hashFilename = exports.getDependencyGraph = exports.setDeclaredAddresses = exports.postProcessCairoFile = exports.HASH_OPTION = exports.HASH_SIZE = void 0;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const starknetCli_1 = require("../starknetCli");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
exports.HASH_SIZE = 8;
exports.HASH_OPTION = 'sha256';
/**
  Is used post transpilation to insert the class hash for any contract that can deploy another.
  During transpilation 0 is placed where the class hash would be because contracts to declare
  have not yet been fully transpiled. At this stage all contracts have been transpiled, so they
  can be  compiled and their class hash computed. Each class hash needed is written into the
  cairo contract
  @param contractPath: The path to the cairo File being processed.
  @param outputDir: Directory where the path is getting stored
  @param contractHashToClassHash:
    A mapping that holds the contract path with out the pathPrefix and maps
    it to the contracts class hash.
  @returns cairoFilePath: The path to the cairo File that was processed.
 */
function postProcessCairoFile(contractPath, outputDir, debugInfo, contractHashToClassHash) {
    // Creates a dependency graph for the file
    const dependencyGraph = getDependencyGraph(contractPath, outputDir);
    // Gets the files that are dependant on the hash.
    // const fullPath = path.join(outputDir, contractPath);
    const filesToHash = dependencyGraph.get(contractPath);
    // If the file has nothing to hash then we can leave.
    if (filesToHash === undefined || filesToHash.length === 0) {
        return contractPath;
    }
    // If the file does have dependencies then we need to make sure that the dependencies of
    // those files have been calculated and inserted.
    filesToHash.forEach((file) => {
        hashDependencies(file, outputDir, debugInfo, dependencyGraph, contractHashToClassHash);
    });
    setDeclaredAddresses(path.join(outputDir, contractPath), contractHashToClassHash);
    return contractPath;
}
exports.postProcessCairoFile = postProcessCairoFile;
function hashDependencies(contractPath, outputDir, debugInfo, dependencyGraph, contractHashToClassHash) {
    const filesToHash = dependencyGraph.get(contractPath);
    // Base case: If the file has no dependencies to hash then we hash the compiled file
    // and add it to the contractHashToClassHash map
    if (filesToHash === undefined || filesToHash.length === 0) {
        addClassHash(contractPath, outputDir, debugInfo, contractHashToClassHash);
        return;
    }
    filesToHash
        .map((file) => {
        hashDependencies(file, outputDir, debugInfo, dependencyGraph, contractHashToClassHash);
        return file;
    })
        .forEach((file) => {
        setDeclaredAddresses(path.join(outputDir, file), contractHashToClassHash);
    });
    addClassHash(contractPath, outputDir, debugInfo, contractHashToClassHash);
}
/**
 * Hashes the contract at `contractPath` and stores it in `contractHashToClassHash`
 */
function addClassHash(contractPath, outputDir, debugInfo, contractHashToClassHash) {
    const fileUniqueId = hashFilename(path.resolve(contractPath));
    let classHash = contractHashToClassHash.get(fileUniqueId);
    if (classHash === undefined) {
        classHash = computeClassHash(path.join(outputDir, contractPath), debugInfo);
        contractHashToClassHash.set(fileUniqueId, classHash);
    }
}
/**
 * Given a cairo contract at `contractPath` returns its classhash
 * @param contractPath path to cairo file
 * @param debugInfo compile cairo file for debug
 * @returns the class hash of the cairo file
 */
function computeClassHash(contractPath, debugInfo) {
    const { success, resultPath } = (0, starknetCli_1.compileCairo)(contractPath, path.resolve(__dirname, '..', '..'), {
        debugInfo,
    });
    if (!success) {
        throw new errors_1.CLIError(`Compilation of cairo file ${contractPath} failed`);
    }
    else {
        (0, assert_1.default)(resultPath !== undefined && success);
        const classHash = (0, utils_1.runStarknetClassHash)(resultPath);
        return classHash;
    }
}
/**
 *  Read a cairo file and for each constant of the form `const name = value`
 *  if `name` is of the form   `<contractName>_<contractId>` then it corresponds
 *  to a placeholder waiting to be filled with the corresponding contract class hash
 *  @param contractPath location of cairo file
 *  @param declarationAddresses mapping of: (placeholder hash) => (starknet class hash)
 */
function setDeclaredAddresses(contractPath, declarationAddresses) {
    const plainCairoCode = (0, fs_1.readFileSync)(contractPath, 'utf8');
    const cairoCode = plainCairoCode.split('\n');
    let update = false;
    const newCairoCode = cairoCode.map((codeLine) => {
        const [constant, fullName, equal, ...other] = codeLine.split(new RegExp('[ ]+'));
        // if (constant === '//' && fullName === '@declare') return '';
        if (constant !== 'const')
            return codeLine;
        (0, assert_1.default)(other.length === 1, `Parsing failure, unexpected extra tokens: ${other.join(' ')}`);
        const name = fullName.slice(0, -exports.HASH_SIZE - 1);
        const uniqueId = fullName.slice(-exports.HASH_SIZE);
        const declaredAddress = declarationAddresses.get(uniqueId);
        (0, assert_1.default)(declaredAddress !== undefined, `Cannot find declared address for ${name} with hash ${uniqueId}`);
        // Flag that there are changes that need to be rewritten
        update = true;
        const newLine = [constant, fullName, equal, declaredAddress, ';'].join(' ');
        return newLine;
    });
    if (!update)
        return;
    const plainNewCairoCode = newCairoCode.join('\n');
    (0, fs_1.writeFileSync)(contractPath, plainNewCairoCode);
}
exports.setDeclaredAddresses = setDeclaredAddresses;
/**
 * Produce a dependency graph among Cairo files. Due to cairo rules this graph is
 * more specifically a Directed Acyclic Graph (DAG)
 * A file A is said to be dependant from a file B if file A needs the class hash
 * of file B.
 * @param root file to explore for dependencies
 * @param outputDir directory where cairo files are stored
 * @returns a map from string to list of strings, where the key is a file and the value are all the dependencies
 */
function getDependencyGraph(root, outputDir) {
    const filesToDeclare = extractContractsToDeclare(root, outputDir);
    const graph = new Map([[root, filesToDeclare]]);
    const pending = [...filesToDeclare];
    let count = 0;
    while (count < pending.length) {
        const fileSource = pending[count];
        if (graph.has(fileSource)) {
            count++;
            continue;
        }
        const newFilesToDeclare = extractContractsToDeclare(fileSource, outputDir);
        graph.set(fileSource, newFilesToDeclare);
        pending.push(...newFilesToDeclare);
        count++;
    }
    return graph;
}
exports.getDependencyGraph = getDependencyGraph;
/**
 * Read a cairo file and parse all instructions of the form:
 * @declare `location`. All `location` are gathered and then returned
 * @param contractPath cairo file path to read
 * @param outputDir filepath may be different during transpilation and after transpilation. This parameter is appended at the beginning to make them equal
 * @returns list of locations
 */
function extractContractsToDeclare(contractPath, outputDir) {
    const plainCairoCode = (0, fs_1.readFileSync)(path.join(outputDir, contractPath), 'utf8');
    const cairoCode = plainCairoCode.split('\n');
    const contractsToDeclare = cairoCode
        .map((line) => {
        const [comment, declare, location, ...other] = line.split(new RegExp('[ ]+'));
        if (comment !== '//' || declare !== '@declare')
            return '';
        (0, assert_1.default)(other.length === 0, `Parsing failure, unexpected extra tokens: ${other.join(' ')}`);
        return location;
    })
        .filter((val) => val !== '');
    return contractsToDeclare;
}
/**
 * Hash function used during transpilation and post-linking so same hash
 * given same input is produced during both phases
 * @param filename filesystem path
 * @returns hashed value
 */
function hashFilename(filename) {
    return (0, crypto_1.createHash)(exports.HASH_OPTION).update(filename).digest('hex').slice(0, exports.HASH_SIZE);
}
exports.hashFilename = hashFilename;
//# sourceMappingURL=postCairoWrite.js.map