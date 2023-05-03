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
exports.processDeclareCLI = exports.runStarknetNewAccount = exports.runStarknetDeclare = exports.runStarknetCallOrInvoke = exports.runStarknetDeployAccount = exports.runStarknetDeploy = exports.runStarknetStatus = exports.runStarknetCompile = exports.compileCairo = exports.compileCairo1 = exports.BASE_PATH = void 0;
const assert_1 = __importDefault(require("assert"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const errors_1 = require("./utils/errors");
const utils_1 = require("./utils/utils");
const encode_1 = require("./transcode/encode");
const decode_1 = require("./transcode/decode");
const utils_2 = require("./transcode/utils");
const nethersolc_1 = require("./nethersolc");
const fs_1 = require("fs");
// Options of StarkNet cli commands
const GATEWAY_URL = 'gateway_url';
const FEEDER_GATEWAY_URL = 'feeder_gateway_url';
const ACCOUNT = 'account';
const ACCOUNT_DIR = 'account_dir';
const MAX_FEE = 'max_fee';
const NETWORK = 'network';
const WALLET = 'wallet';
exports.BASE_PATH = path.dirname(__dirname);
const warpVenvPrefix = `PATH=${path.join(exports.BASE_PATH, 'warp_venv', 'bin')}:$PATH`;
const CAIRO1_COMPILE_BIN = path.join(exports.BASE_PATH, 'cairo1', (0, nethersolc_1.getPlatform)(), 'bin', 'warp');
function compileCairo1(cairoProjectPath, debug = true) {
    // check existence of cairo project dir and project files
    (0, assert_1.default)((0, fs_1.existsSync)(cairoProjectPath), `Cairo project does not exist at ${cairoProjectPath}`);
    const scarbToml = path.join(cairoProjectPath, 'Scarb.toml');
    (0, assert_1.default)((0, fs_1.existsSync)(scarbToml), `Scarb.toml does not exist at ${scarbToml}`);
    try {
        if (debug)
            console.log(`Running cairo1 compile`);
        (0, child_process_1.execSync)(`${CAIRO1_COMPILE_BIN} build ${cairoProjectPath}`, {
            stdio: 'inherit',
        });
        return { success: true, outputDir: path.join(cairoProjectPath, 'target') };
    }
    catch (e) {
        if (e instanceof Error) {
            (0, errors_1.logError)('Compile failed');
            return {
                success: false,
                outputDir: undefined,
            };
        }
        else {
            throw e;
        }
    }
}
exports.compileCairo1 = compileCairo1;
function compileCairo(filePath, cairoPath = path.resolve(__dirname, '..'), debugInfo = { debugInfo: false }) {
    (0, assert_1.default)(filePath.endsWith('.cairo'), `Attempted to compile non-cairo file ${filePath} as cairo`);
    const cairoPathRoot = filePath.slice(0, -'.cairo'.length);
    const resultPath = `${cairoPathRoot}_compiled.json`;
    const abiPath = `${cairoPathRoot}_abi.json`;
    const solAbiPath = `${cairoPathRoot}_sol_abi.json`;
    const parameters = new Map([
        ['output', resultPath],
        ['abi', abiPath],
    ]);
    if (cairoPath !== '') {
        parameters.set('cairo_path', cairoPath);
    }
    const debug = debugInfo.debugInfo ? '--debug_info_with_source' : '--no_debug_info';
    const command = 'starknet-compile';
    try {
        console.log(`Running starknet compile on ${filePath}`);
        (0, child_process_1.execSync)(`${warpVenvPrefix} ${command} --disable_hint_validation ${debug} ${filePath} ${[
            ...parameters.entries(),
        ]
            .map(([key, value]) => `--${key} ${value}`)
            .join(' ')}`);
        return { success: true, resultPath, abiPath, solAbiPath, classHash: undefined };
    }
    catch (e) {
        (0, errors_1.logError)((0, utils_1.catchExecSyncError)(e, command));
        return {
            success: false,
            resultPath: undefined,
            abiPath: undefined,
            solAbiPath: undefined,
            classHash: undefined,
        };
    }
}
exports.compileCairo = compileCairo;
function runStarknetCompile(filePath, debug_info) {
    const { success, resultPath } = compileCairo(filePath, path.resolve(__dirname, '..'), debug_info);
    if (!success) {
        (0, errors_1.logError)(`Compilation of contract ${filePath} failed`);
        return;
    }
    console.log(`starknet-compile output written to ${resultPath}`);
}
exports.runStarknetCompile = runStarknetCompile;
function runStarknetStatus(tx_hash, option) {
    if (option.network === undefined) {
        (0, errors_1.logError)(`Error: Exception: feeder_gateway_url must be specified with the "status" subcommand.\nConsider passing --network or setting the STARKNET_NETWORK environment variable.`);
        return;
    }
    const gatewayUrlOption = optionalArg(GATEWAY_URL, option);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, option);
    const command = 'starknet tx_status';
    (0, utils_1.execSyncAndLog)(`${warpVenvPrefix} ${command} --hash ${tx_hash} --network ${option.network} ${gatewayUrlOption} ${feederGatewayUrlOption}`.trim(), command);
}
exports.runStarknetStatus = runStarknetStatus;
async function runStarknetDeploy(filePath, options) {
    if (options.network === undefined) {
        (0, errors_1.logError)(`Error: Exception: feeder_gateway_url must be specified with the "deploy" subcommand.\nConsider passing --network or setting the STARKNET_NETWORK environment variable.`);
        return;
    }
    // Shouldn't be fixed to warp_output (which is the default)
    // such option does not exists currently when deploying, should be added
    let compileResult;
    try {
        compileResult = compileCairo(filePath, path.resolve(__dirname, '..'), options);
    }
    catch (e) {
        if (e instanceof errors_1.CLIError) {
            (0, errors_1.logError)(e.message);
        }
        throw e;
    }
    let inputs;
    try {
        inputs = (await (0, encode_1.encodeInputs)(compileResult.solAbiPath ?? '', 'constructor', options.use_cairo_abi, options.inputs))[1];
        inputs = inputs ? `--inputs ${inputs}` : inputs;
    }
    catch (e) {
        if (e instanceof errors_1.CLIError) {
            (0, errors_1.logError)(e.message);
            return;
        }
        throw e;
    }
    const command = 'starknet deploy';
    let classHash;
    if (!options.no_wallet) {
        (0, assert_1.default)(compileResult.resultPath !== undefined, 'resultPath should not be undefined');
        classHash = (0, utils_1.runStarknetClassHash)(compileResult.resultPath);
    }
    const classHashOption = classHash ? `--class_hash ${classHash}` : '';
    const gatewayUrlOption = optionalArg(GATEWAY_URL, options);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, options);
    const accountOption = optionalArg(ACCOUNT, options);
    const accountDirOption = optionalArg(ACCOUNT_DIR, options);
    const maxFeeOption = optionalArg(MAX_FEE, options);
    const resultPath = compileResult.resultPath;
    const walletOption = options.no_wallet
        ? `--no_wallet --contract ${resultPath} `
        : options.wallet
            ? `${classHashOption} --wallet ${options.wallet}`
            : `${classHashOption}`;
    (0, utils_1.execSyncAndLog)(`${warpVenvPrefix} ${command} --network ${options.network} ${walletOption} ${inputs} ${accountOption} ${gatewayUrlOption} ${feederGatewayUrlOption} ${accountDirOption} ${maxFeeOption}`, command);
}
exports.runStarknetDeploy = runStarknetDeploy;
function runStarknetDeployAccount(options) {
    if (options.wallet === undefined) {
        (0, errors_1.logError)(`Error: AssertionError: --wallet must be specified with the "deploy_account" subcommand.`);
        return;
    }
    if (options.network === undefined) {
        (0, errors_1.logError)(`Error: Exception: network must be specified with the "deploy_account" subcommand.\nConsider passing --network or setting the STARKNET_NETWORK environment variable.`);
        return;
    }
    const gatewayUrlOption = optionalArg(GATEWAY_URL, options);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, options);
    const accountOption = optionalArg(ACCOUNT, options);
    const accountDirOption = optionalArg(ACCOUNT_DIR, options);
    const maxFeeOption = optionalArg(MAX_FEE, options);
    const command = 'starknet deploy_account';
    (0, utils_1.execSyncAndLog)(`${warpVenvPrefix} ${command} --wallet ${options.wallet} --network ${options.network} ${accountOption} ${gatewayUrlOption} ${feederGatewayUrlOption} ${accountDirOption} ${maxFeeOption}`, command);
}
exports.runStarknetDeployAccount = runStarknetDeployAccount;
async function runStarknetCallOrInvoke(filePath, isCall, options) {
    const callOrInvoke = isCall ? 'call' : 'invoke';
    if (options.network === undefined) {
        (0, errors_1.logError)(`Error: Exception: network must be specified with the "${callOrInvoke}" subcommand.\nConsider passing --network or setting the STARKNET_NETWORK environment variable.`);
        return;
    }
    const wallet = options.wallet === undefined ? '--no_wallet' : `--wallet ${options.wallet}`;
    const gatewayUrlOption = optionalArg(GATEWAY_URL, options);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, options);
    const accountOption = optionalArg(ACCOUNT, options);
    const accountDirOption = optionalArg(ACCOUNT_DIR, options);
    const maxFeeOption = optionalArg(MAX_FEE, options);
    const { success, abiPath, solAbiPath } = compileCairo(filePath, path.resolve(__dirname, '..'));
    if (!success) {
        (0, errors_1.logError)(`Compilation of contract ${filePath} failed`);
        return;
    }
    let funcName, inputs;
    try {
        [funcName, inputs] = await (0, encode_1.encodeInputs)(`${solAbiPath}`, options.function, options.use_cairo_abi, options.inputs);
        inputs = inputs ? `--inputs ${inputs}` : inputs;
    }
    catch (e) {
        if (e instanceof errors_1.CLIError) {
            (0, errors_1.logError)(e.message);
            return;
        }
        throw e;
    }
    const command = `starknet ${callOrInvoke}`;
    try {
        let warpOutput = (0, child_process_1.execSync)(`${warpVenvPrefix} ${command} --address ${options.address} --abi ${abiPath} --function ${funcName} --network ${options.network} ${wallet} ${accountOption} ${inputs} ${gatewayUrlOption} ${feederGatewayUrlOption} ${accountDirOption} ${maxFeeOption}`.trim()).toString('utf-8');
        if (isCall && !options.use_cairo_abi) {
            const decodedOutputs = await (0, decode_1.decodeOutputs)(solAbiPath ?? '', options.function, warpOutput.toString().split(' '));
            warpOutput = (0, utils_2.decodedOutputsToString)(decodedOutputs);
        }
        console.log(warpOutput);
    }
    catch (e) {
        (0, errors_1.logError)((0, utils_1.catchExecSyncError)(e, command));
    }
}
exports.runStarknetCallOrInvoke = runStarknetCallOrInvoke;
function declareContract(filePath, options) {
    // wallet check
    if (!options.no_wallet) {
        if (options.wallet === undefined) {
            (0, errors_1.logError)('A wallet must be specified (using --wallet or the STARKNET_WALLET environment variable), unless specifically using --no_wallet.');
            return;
        }
    }
    // network check
    if (options.network === undefined) {
        (0, errors_1.logError)(`Error: Exception: feeder_gateway_url must be specified with the declare command.\nConsider passing --network or setting the STARKNET_NETWORK environment variable.`);
        return;
    }
    const networkOption = optionalArg(NETWORK, options);
    const walletOption = options.no_wallet ? '--no_wallet' : optionalArg(WALLET, options);
    const accountOption = optionalArg(ACCOUNT, options);
    const gatewayUrlOption = optionalArg(GATEWAY_URL, options);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, options);
    const accountDirOption = optionalArg(ACCOUNT_DIR, options);
    const maxFeeOption = optionalArg(MAX_FEE, options);
    const command = 'starknet declare';
    (0, utils_1.execSyncAndLog)(`${warpVenvPrefix} ${command} --contract ${filePath} ${networkOption} ${walletOption} ${accountOption} ${gatewayUrlOption} ${feederGatewayUrlOption} ${accountDirOption} ${maxFeeOption}`, command);
}
function runStarknetDeclare(filePath, options) {
    const { success, resultPath } = compileCairo(filePath, path.resolve(__dirname, '..'));
    if (!success) {
        (0, errors_1.logError)(`Compilation of contract ${filePath} failed`);
        return;
    }
    else {
        (0, assert_1.default)(resultPath !== undefined);
        declareContract(resultPath, options);
    }
}
exports.runStarknetDeclare = runStarknetDeclare;
function runStarknetNewAccount(options) {
    const networkOption = optionalArg(NETWORK, options);
    const walletOption = optionalArg(WALLET, options);
    const accountOption = optionalArg(ACCOUNT, options);
    const gatewayUrlOption = optionalArg(GATEWAY_URL, options);
    const feederGatewayUrlOption = optionalArg(FEEDER_GATEWAY_URL, options);
    const accountDirOption = optionalArg(ACCOUNT_DIR, options);
    const command = 'starknet new_account';
    (0, utils_1.execSyncAndLog)(`${warpVenvPrefix} ${command} ${networkOption} ${walletOption} ${accountOption} ${gatewayUrlOption} ${feederGatewayUrlOption} ${accountDirOption}`, command);
}
exports.runStarknetNewAccount = runStarknetNewAccount;
function processDeclareCLI(result, filePath) {
    const splitter = new RegExp('[ ]+');
    // Extract the hash from result
    const classHash = result
        .split('\n')
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
exports.processDeclareCLI = processDeclareCLI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function optionalArg(name, options) {
    const value = options[name];
    return value ? `--${name} ${value}` : '';
}
//# sourceMappingURL=starknetCli.js.map