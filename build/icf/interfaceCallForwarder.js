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
exports.generateSolInterface = void 0;
const starknetCli_1 = require("../starknetCli");
const path = __importStar(require("path"));
const errors_1 = require("../utils/errors");
const fs_1 = __importDefault(require("fs"));
const ast_1 = require("../ast/ast");
const solc_typed_ast_1 = require("solc-typed-ast");
const formatting_1 = require("../utils/formatting");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const console_1 = require("console");
const genCairo_1 = require("./genCairo");
const utils_1 = require("./utils");
const export_1 = require("../export");
const defaultSolcVersion = '0.8.14';
/**
 * Generate a cairo & solidity interface from given cairo contract file to interact
 * with it (given cairo contract) from a solidity contract.
 * More details you can find in the README.md file.
 * @param filePath : path to the cairo contract file
 * @param options : options for the generation (solc version, output directory, etc.)
 * @returns : none
 */
function generateSolInterface(filePath, options) {
    const cairoPathRoot = filePath.slice(0, -'.cairo'.length);
    const { success, resultPath, abiPath } = (0, starknetCli_1.compileCairo)(filePath, path.resolve(__dirname, '..'), {
        debugInfo: false,
    });
    if (!success) {
        (0, errors_1.logError)(`Compilation of contract ${filePath} failed`);
        return;
    }
    else {
        if (resultPath)
            fs_1.default.unlinkSync(resultPath);
    }
    let solPath = `${cairoPathRoot}.sol`; // default path for the generated solidity file
    let cairoContractPath = `${cairoPathRoot}_forwarder.cairo`; // default path for the generated cairo contract file
    if (options.output) {
        const filePathRoot = options.output.slice(0, -'.sol'.length);
        solPath = options.output;
        cairoContractPath = filePathRoot + '.cairo';
    }
    const abi = abiPath ? JSON.parse(fs_1.default.readFileSync(abiPath, 'utf8')) : [];
    // generate the cairo contract that will be used to interact with the given cairo contract
    let cairoContract = (0, genCairo_1.genCairoContract)(abi, options.contractAddress, options.classHash);
    const writer = new solc_typed_ast_1.ASTWriter(new Map([...solc_typed_ast_1.DefaultASTWriterMapping]), new solc_typed_ast_1.PrettyFormatter(4, 0), options.solcVersion ?? defaultSolcVersion);
    const sourceUint = new solc_typed_ast_1.SourceUnit(0, '', solPath, 0, solPath, new Map(), []);
    sourceUint.context = new solc_typed_ast_1.ASTContext(sourceUint);
    const ast = new ast_1.AST([sourceUint], options.solcVersion ?? defaultSolcVersion, {
        contracts: {},
        sources: {},
    });
    addPragmaDirective(options.solcVersion ?? defaultSolcVersion, sourceUint, ast);
    // add uint256 version of the structs from the cairo contract after transformation
    // of all felt types to uint256 to the source unit and also the structs that represents
    // the heterogeneous tuples used in the given cairo contract
    const structDefs = addAllStructs(sourceUint, ast, abi);
    // solidity interface contract
    const { contract, funcSignatures } = addForwarderContract(abi, sourceUint, structDefs, ast, cairoPathRoot.split('/').pop());
    if (abiPath)
        fs_1.default.unlinkSync(abiPath);
    // replace function names in the generated cairo contract such that it'll match the function
    // names in the generated solidity contract after transpilation of the latter
    funcSignatures.forEach((value, key) => {
        cairoContract = cairoContract.replace(`_ITR_${key}`, `${key}_${value}`);
    });
    fs_1.default.writeFileSync(cairoContractPath, cairoContract);
    const compileForwarder = (0, starknetCli_1.compileCairo)(cairoContractPath, path.resolve(__dirname, '../../'), {
        debugInfo: false,
    });
    contract.documentation = `WARP-GENERATED\nclass_hash: ${compileForwarder.resultPath ? (0, export_1.runStarknetClassHash)(compileForwarder.resultPath) : '0x0'}`;
    if (compileForwarder.success) {
        if (compileForwarder.resultPath)
            fs_1.default.unlinkSync(compileForwarder.resultPath);
        if (compileForwarder.abiPath)
            fs_1.default.unlinkSync(compileForwarder.abiPath);
    }
    const result = (0, formatting_1.removeExcessNewlines)(writer.write(ast.roots[0]), 2);
    fs_1.default.writeFileSync(solPath, result);
}
exports.generateSolInterface = generateSolInterface;
function addPragmaDirective(version, sourceUint, ast) {
    /**
     * Add a pragma directive to the given source unit
     */
    const id = ast.reserveId();
    const src = '';
    const name = 'solidity';
    const value = version;
    const raw = {
        id,
        src,
        name,
        value,
    };
    const pragma = new solc_typed_ast_1.PragmaDirective(id, src, [name, '^', value], raw);
    sourceUint.appendChild(pragma);
    ast.registerChild(pragma, sourceUint);
}
/**
 * Add a contract to the given source unit that will be used to interact with the given cairo contract
 * via the generated cairo contract
 * @param abi : abi of the given cairo contract
 * @param sourceUint : source unit to add the contract to
 * @param structDefs : map of the struct definitions that has been added to the source unit
 * @param ast : ast of the given source unit
 * @param fileName : name of the given cairo contract file
 * @returns : map of the function signatures and their corresponding function names
 */
function addForwarderContract(abi, sourceUint, structDefs, ast, fileName) {
    const id = ast.reserveId();
    const contract = new solc_typed_ast_1.ContractDefinition(id, '', 'Forwarder_' + fileName ?? 'contract', sourceUint.id, solc_typed_ast_1.ContractKind.Interface, false, false, [], []);
    sourceUint.appendChild(contract);
    ast.registerChild(contract, sourceUint);
    // add functions to the contract that will be used to interact with the given cairo contract
    return {
        contract: contract,
        funcSignatures: addInteractiveFunctions(contract, structDefs, ast, abi, (0, utils_1.typeToStructMapping)((0, utils_1.getStructsFromABI)(abi))),
    };
}
/**
  Add the solidity structs that are equivalent to the cairo structs after
  transformation of all felt types to uint256 and also structs corresponding to
  heterogeneous tuples (e.g `param: (felt, (Uint256, felt))`) that are used
  in the given cairo contract
 * @param sourceUint : source unit to add the structs to
 * @param ast : ast of the given source unit
 * @param abi : abi of the given cairo contract
 * @returns : map of the struct names and their corresponding struct definitions
 */
function addAllStructs(sourceUint, ast, abi) {
    const transformedStructs = new Map();
    // getAllStructsFromABI ensures that the structs are added in the correct order
    // and fetch all structs that are transformed (uint256 version), structs that are
    // added as a result of transformation of heterogeneous tuples
    (0, utils_1.getAllStructsFromABI)(abi).forEach((item) => {
        const id = ast.reserveId();
        const struct = new solc_typed_ast_1.StructDefinition(id, '', item.name, sourceUint.id, 'public', item.members.map((member) => {
            const typeName = getSolTypeName(member.type, transformedStructs, ast);
            return new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, false, member.name, id, false, solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, typeName.typeString, undefined, typeName);
        }));
        sourceUint.appendChild(struct);
        ast.registerChild(struct, sourceUint);
        transformedStructs.set(item.name, struct);
    });
    return transformedStructs;
}
/**
 * Returns TypeName Node for the given cairo type
 * @param cairoType : cairo type string
 * @param structDefs : solidity struct definitions that have been added to the source unit
 * @param ast : ast of the source unit
 * @returns : solidity TypeName object that corresponds to the given cairo type
 */
function getSolTypeName(cairoType, structDefs, ast) {
    cairoType = cairoType.trim();
    if (cairoType === 'Uint256' || cairoType === 'felt') {
        return (0, nodeTemplates_1.createUint256TypeName)(ast);
    }
    if (cairoType.endsWith('*')) {
        const baseTypeName = getSolTypeName(cairoType.slice(0, -1), structDefs, ast);
        return (0, nodeTemplates_1.createArrayTypeName)(baseTypeName, ast);
    }
    if (cairoType.startsWith('(') && cairoType.endsWith(')')) {
        const subTypes = (0, utils_1.tupleParser)(cairoType);
        // assert all subtypes are the same string
        // Since there is no way to represent a tuple in solidity,
        // we will represent as an array for the same types and a struct for different types
        // since heterogeneous tuples are represented as structs it should not contain parentheses
        // after type transformation transformation ( see transformType function in ../utils/util.ts)
        (0, console_1.assert)(subTypes.every((subType) => subType === subTypes[0]), 'Tuple types must be homogeneous');
        const baseTypeName = getSolTypeName(subTypes[0], structDefs, ast);
        return (0, nodeTemplates_1.createStaticArrayTypeName)(baseTypeName, subTypes.length, ast);
    }
    if (structDefs.has(cairoType)) {
        const refStructDef = structDefs.get(cairoType);
        if (refStructDef === undefined) {
            throw new Error(`Could not find struct definition for ${cairoType}`);
        }
        return new solc_typed_ast_1.UserDefinedTypeName(ast.reserveId(), '', `struct ${cairoType}`, cairoType, refStructDef.id);
    }
    throw new Error(`Unsupported Cairo type ${cairoType}`);
}
/**
 * Returns variable declaration nodes for the interactive functions
 * @param params : array of cairo parameters from abi function items
 * @param scope : scope for the variable declarations
 * @param structDefs : map of the struct definitions that has been added to the source unit
 * @param ast : ast of the source unit
 * @param typeToStructMap : map of the cairo types and their corresponding struct abi items
 * @returns : array of variable declarations that can be used in function definition
 */
function getParametersCairoType(params, scope, structDefs, ast, typeToStructMap) {
    const parameters = [];
    params.forEach((param) => {
        const transformedType = (0, utils_1.transformType)(param.type, typeToStructMap);
        const solTypeName = getSolTypeName(transformedType, structDefs, ast);
        if (solTypeName instanceof solc_typed_ast_1.ArrayTypeName && solTypeName.vLength === undefined) {
            (0, console_1.assert)(parameters.length > 0 &&
                parameters[parameters.length - 1].name === param.name + '_len' &&
                parameters[parameters.length - 1].typeString === 'uint256', `Array argument "${param.name}" must be preceded by a length argument named "${param.name}_len" of type felt`);
            parameters.pop();
        }
        parameters.push(new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, false, param.name, scope, false, solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, solTypeName.typeString, undefined, solTypeName));
    });
    return parameters;
}
/**
 * Add function definition to the given contract and returns function signatures
 * @param contract : solidity contract definition object
 * @param structDefs : map of the struct definitions that has been added to the source unit
 * @param ast : ast of the source unit
 * @param abi : abi of the cairo contract
 * @param typeToStructMap : map of the cairo types and their corresponding struct abi items
 * @returns : Map of the function name and the function signature
 */
function addInteractiveFunctions(contract, structDefs, ast, abi, typeToStructMap) {
    const functionItems = (0, utils_1.getFunctionItems)(abi);
    const functions = [];
    functionItems.forEach((element) => {
        const funcDef = (isDelegate) => {
            const id = ast.reserveId();
            const inputParameters = getParametersCairoType(element.inputs, id, structDefs, ast, typeToStructMap);
            const returnParameters = getParametersCairoType(element.outputs, id, structDefs, ast, typeToStructMap);
            return new solc_typed_ast_1.FunctionDefinition(id, '', contract.id, solc_typed_ast_1.FunctionKind.Function, (isDelegate ? '_delegate_' : '') + element.name, false, solc_typed_ast_1.FunctionVisibility.External, solc_typed_ast_1.FunctionStateMutability.NonPayable, false, // is constructor
            new solc_typed_ast_1.ParameterList(ast.reserveId(), '', inputParameters), // parameters
            new solc_typed_ast_1.ParameterList(ast.reserveId(), '', returnParameters), // return parameters
            [], // modifiers
            undefined, // override specifier
            undefined);
        };
        functions.push(funcDef(false), funcDef(true));
    });
    const signatures = new Map();
    functions.forEach((f) => {
        contract.appendChild(f);
        ast.setContextRecursive(f);
        // set function array/complex parameters to be calldata
        f.vParameters.vParameters.forEach((param) => {
            if (param.vType instanceof solc_typed_ast_1.ArrayTypeName ||
                (param.vType instanceof solc_typed_ast_1.UserDefinedTypeName &&
                    param.vType.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition)) {
                param.storageLocation = solc_typed_ast_1.DataLocation.CallData;
            }
        });
        // set function return array/complex parameters to be Calldata
        f.vReturnParameters.vParameters.forEach((param) => {
            if (param.vType instanceof solc_typed_ast_1.ArrayTypeName ||
                (param.vType instanceof solc_typed_ast_1.UserDefinedTypeName &&
                    param.vType.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition)) {
                param.storageLocation = solc_typed_ast_1.DataLocation.CallData;
            }
        });
        signatures.set(f.name, (0, export_1.safeCanonicalHash)(f, ast));
    });
    return signatures;
}
//# sourceMappingURL=interfaceCallForwarder.js.map