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
exports.createCairoProject = exports.runTranspile = exports.program = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const commander_1 = require("commander");
const io_1 = require("./io");
const solCompile_1 = require("./solCompile");
const transpiler_1 = require("./transpiler");
const analyseSol_1 = require("./utils/analyseSol");
const starknetCli_1 = require("./starknetCli");
const chalk_1 = __importDefault(require("chalk"));
const setupVenv_1 = require("./utils/setupVenv");
const interfaceCallForwarder_1 = require("./icf/interfaceCallForwarder");
const fs_1 = require("./utils/fs");
const postCairoWrite_1 = require("./utils/postCairoWrite");
const utils_1 = require("./utils/utils");
const child_process_1 = require("child_process");
const endent_1 = __importDefault(require("endent"));
exports.program = new commander_1.Command();
exports.program
    .command('transpile <files...>')
    .description('Transpile Solidity contracts into Cairo contracts')
    .option('--compile-cairo', 'Compile the output to bytecode')
    .option('--check-trees', 'Debug: Run sanity checks on all intermediate ASTs')
    // for development mode
    .option('--dev', 'Run AST sanity checks on every pass instead of the final AST only', false)
    .option('--format-cairo', 'Format the cairo output - can be slow on large contracts')
    .option('--highlight <ids...>', 'Debug: Highlight selected ids in the AST printed by --print-trees')
    .option('--order <passOrder>', 'Use a custom set of transpilation passes')
    .option('-o, --output-dir <path>', 'Output directory for transpiled Cairo files.', 'warp_output')
    .option('-d, --debug-info', 'Include debug information in the compiled bytecode produced by --compile-cairo', false)
    .option('--print-trees', 'Debug: Print all the intermediate ASTs')
    .option('--no-stubs', 'Debug: Hide the stubs in the intermediate ASTs when using --print-trees')
    .option('--no-strict', 'Debug: Allow silent failure of AST consistency checks')
    .option('--until <pass>', 'Stops transpilation after the specified pass')
    .option('--no-warnings', 'Suppress warnings from the Solidity compiler')
    .option('--include-paths <paths...>', 'Pass through to solc --include-path option')
    .option('--base-path <path>', 'Pass through to solc --base-path option')
    .action(runTranspile);
function runTranspile(files, options) {
    // We do the extra work here to make sure all the errors are printed out
    // for all files which are invalid.
    if (files.map((file) => (0, io_1.isValidSolFile)(file)).some((result) => !result))
        return;
    const [defaultBasePath, defaultIncludePath] = (0, utils_1.defaultBasePathAndIncludePath)();
    if (defaultBasePath !== null && defaultIncludePath !== null) {
        options.includePaths =
            options.includePaths === undefined
                ? [defaultIncludePath]
                : options.includePaths.concat(defaultIncludePath);
        options.basePath = options.basePath || defaultBasePath;
    }
    // map file location relative to current working directory
    const mFiles = files.map((file) => path.relative(process.cwd(), file));
    const ast = (0, solCompile_1.compileSolFiles)(mFiles, options);
    const contractToHashMap = new Map();
    try {
        (0, transpiler_1.transpile)(ast, options)
            .map(([fileName, cairoCode]) => {
            (0, io_1.outputResult)(path.parse(fileName).name, fileName, cairoCode, options, ast);
            return fileName;
        })
            .map((file) => (0, postCairoWrite_1.postProcessCairoFile)(file, options.outputDir, options.debugInfo, contractToHashMap))
            .forEach((file) => {
            createCairoProject(path.join(options.outputDir, file));
            if (options.compileCairo) {
                const { success, resultPath, abiPath } = (0, starknetCli_1.compileCairo)(path.join(options.outputDir, file), starknetCli_1.BASE_PATH, options);
                if (!success) {
                    if (resultPath !== undefined) {
                        fs.unlinkSync(resultPath);
                    }
                    if (abiPath !== undefined) {
                        fs.unlinkSync(abiPath);
                    }
                }
            }
        });
    }
    catch (e) {
        (0, transpiler_1.handleTranspilationError)(e);
    }
}
exports.runTranspile = runTranspile;
function createCairoProject(filePath) {
    const outputRoot = path.dirname(path.dirname(filePath));
    const packageName = path.basename(outputRoot, '.sol').replace('-', '_');
    const scarbConfigPath = path.join(outputRoot, 'Scarb.toml');
    const warplib = path.join(starknetCli_1.BASE_PATH, 'warplib');
    (0, fs_1.outputFileSync)(scarbConfigPath, (0, endent_1.default) `
    [package]
    name = "${packageName}"
    version = "1.0.0"

    [dependencies]
    warplib = { path = "${warplib}" }

    [[target.warp]]
    `);
    // create lib.cairo
    const libPath = path.join(path.dirname(filePath), 'lib.cairo');
    const contractName = path.parse(filePath).name;
    (0, fs_1.outputFileSync)(libPath, `mod ${contractName};`);
}
exports.createCairoProject = createCairoProject;
exports.program
    .command('transform <file>')
    .description('Debug tool which applies any set of passes to the AST and writes out the transformed Solidity')
    .option('--check-trees', 'Debug: Run sanity checks on all intermediate ASTs')
    .option('--highlight <ids...>', 'Debug: highlight selected ids in the AST printed by --print-trees')
    .option('--order <passOrder>', 'Use a custom set of transpilation passes')
    .option('-o, --output-dir <path>', 'Output directory for transformed Solidity files')
    .option('--print-trees', 'Debug: Print all the intermediate ASTs')
    .option('--no-stubs', 'Debug: Hide the stubs in the intermediate ASTs when using --print-trees')
    .option('--no-strict', 'Debug: Allow silent failure of AST consistency checks')
    .option('--until <pass>', 'Stop processing at specified pass')
    .option('--no-warnings', 'Suppress printed warnings')
    .option('--include-paths <paths...>', 'Pass through to solc --include-path option')
    .option('--base-path <path>', 'Pass through to solc --base-path option')
    .action(runTransform);
function runTransform(file, options) {
    if (!(0, io_1.isValidSolFile)(file))
        return;
    const [defaultBasePath, defaultIncludePath] = (0, utils_1.defaultBasePathAndIncludePath)();
    if (defaultBasePath !== null && defaultIncludePath !== null) {
        options.includePaths =
            options.includePaths === undefined
                ? [defaultIncludePath]
                : options.includePaths.concat(defaultIncludePath);
        options.basePath = options.basePath || defaultBasePath;
    }
    try {
        const mFile = path.relative(process.cwd(), file);
        const ast = (0, solCompile_1.compileSolFiles)([mFile], options);
        (0, transpiler_1.transform)(ast, options).map(([fname, solidity]) => {
            (0, io_1.outputResult)(path.parse(fname).name, (0, io_1.replaceSuffix)(fname, '_warp.cairo'), solidity, options, ast);
        });
    }
    catch (e) {
        (0, transpiler_1.handleTranspilationError)(e);
    }
}
exports.program
    .command('analyse <file>')
    .description('Debug tool to analyse the AST')
    .option('--highlight <ids...>', 'Highlight selected ids in the AST')
    .action((file, options) => (0, analyseSol_1.analyseSol)(file, options));
exports.program
    .command('status <tx_hash>')
    .description('Get the status of a transaction')
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .action((tx_hash, options) => {
    (0, starknetCli_1.runStarknetStatus)(tx_hash, options);
});
exports.program
    .command('compile <file>')
    .description('Compile cairo files with warplib in the cairo-path')
    .option('-d, --debug-info', 'Include debug information', false)
    .action((file, options) => {
    (0, starknetCli_1.runStarknetCompile)(file, options);
});
exports.program
    .command('gen-interface <file>')
    .description('Use native Cairo contracts in your Solidity by creating a Solidity interface and a Cairo translation contract for the target Cairo contract')
    .option('--cairo-path <cairo-path>', 'Cairo libraries/modules import path')
    .option('--output <output>', 'Output path for the Solidity interface and the Cairo translation contract')
    .option('--contract-address <contract-address>', 'Address at which the target cairo contract has been deployed')
    .option('--class-hash <class-hash>', 'Class hash of the cairo contract')
    .option('--solc-version <version>', 'Solc version to use', '0.8.14')
    .action(interfaceCallForwarder_1.generateSolInterface);
exports.program
    .command('deploy <file>')
    .description('Deploy a warped cairo contract')
    .option('-d, --debug_info', 'Compile include debug information', false)
    .option('--inputs <inputs...>', 'Arguments to be passed to constructor of the program as a comma separated list of strings, ints and lists', undefined)
    .option('--use_cairo_abi', 'Use the cairo abi instead of solidity for the inputs', false)
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--no_wallet', 'Do not use a wallet for deployment', false)
    .option('--wallet <wallet>', 'Wallet provider to use', process.env.STARKNET_WALLET)
    .option('--account <account>', 'Account to use for deployment', undefined)
    .option('--account_dir <account_dir>', 'The directory of the account.', process.env.STARKNET_ACCOUNT_DIR)
    .option('--max_fee <max_fee>', 'Maximum fee to pay for the transaction.')
    .action(starknetCli_1.runStarknetDeploy);
exports.program
    .command('deploy_account')
    .description('Deploy an account to Starknet')
    .option('--account <account>', 'The name of the account. If not given, the default for the wallet will be used')
    .option('--account_dir <account_dir>', 'The directory of the account.', process.env.STARKNET_ACCOUNT_DIR)
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--wallet <wallet>', 'The name of the wallet, including the python module and wallet class', process.env.STARKNET_WALLET)
    .option('--max_fee <max_fee>', 'Maximum fee to pay for the transaction.')
    .action(starknetCli_1.runStarknetDeployAccount);
exports.program
    .command('invoke <file>')
    .description('Invoke a function on a warped contract using the Solidity abi')
    .requiredOption('--address <address>', 'Address of contract to invoke')
    .requiredOption('--function <function>', 'Function to invoke')
    .option('--inputs <inputs...>', 'Input to function as a comma separated string, use square brackets to represent lists and structs. Numbers can be represented in decimal and hex.', undefined)
    .option('--use_cairo_abi', 'Use the cairo abi instead of solidity for the inputs', false)
    .option('--account <account>', 'The name of the account. If not given, the default for the wallet will be used')
    .option('--account_dir <account_dir>', 'The directory of the account', process.env.STARKNET_ACCOUNT_DIR)
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--wallet <wallet>', 'The name of the wallet, including the python module and wallet class', process.env.STARKNET_WALLET)
    .option('--max_fee <max_fee>', 'Maximum fee to pay for the transaction')
    .action(async (file, options) => {
    (0, starknetCli_1.runStarknetCallOrInvoke)(file, false, options);
});
exports.program
    .command('call <file>')
    .description('Call a function on a warped contract using the Solidity abi')
    .requiredOption('--address <address>', 'Address of contract to call')
    .requiredOption('--function <function>', 'Function to call')
    .option('--inputs <inputs...>', 'Input to function as a comma separated string, use square brackets to represent lists and structs. Numbers can be represented in decimal and hex.', undefined)
    .option('--use_cairo_abi', 'Use the cairo abi instead of solidity for the inputs', false)
    .option('--account <account>', 'The name of the account. If not given, the default for the wallet will be used')
    .option('--account_dir <account_dir>', 'The directory of the account', process.env.STARKNET_ACCOUNT_DIR)
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--wallet <wallet>', 'The name of the wallet, including the python module and wallet class', process.env.STARKNET_WALLET)
    .option('--max_fee <max_fee>', 'Maximum fee to pay for the transaction')
    .action(async (file, options) => {
    (0, starknetCli_1.runStarknetCallOrInvoke)(file, true, options);
});
exports.program
    .command('install')
    .description('Install the python dependencies required for Warp')
    .option('--python <python>', 'Path to a python3.9 executable', 'python3.9')
    .option('-v, --verbose', 'Display python setup info')
    .action(setupVenv_1.runVenvSetup);
exports.program
    .command('declare <cairo_contract>')
    .description('Declare a Cairo contract')
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--account <account>', 'The name of the account. If not given, the default for the wallet will be used.')
    .option('--account_dir <account_dir>', 'The directory of the account', process.env.STARKNET_ACCOUNT_DIR)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--wallet <wallet>', 'The name of the wallet, including the python module and wallet class', process.env.STARKNET_WALLET)
    .option('--max_fee <max_fee>', 'Maximum fee to pay for the transaction')
    .action(starknetCli_1.runStarknetDeclare);
exports.program
    .command('new_account')
    .description('Command to create a new account')
    .option('--account <account>', 'The name of the account. If not given, account will be named "__default__". If it already exists, it will be overwritten.')
    .option('--account_dir <account_dir>', 'The directory of the account', process.env.STARKNET_ACCOUNT_DIR)
    .option('--network <network>', 'Starknet network URL', process.env.STARKNET_NETWORK)
    .option('--gateway_url <gateway_url>', 'Starknet gateway URL', process.env.STARKNET_GATEWAY_URL)
    .option('--feeder_gateway_url <feeder_gateway_url>', 'Starknet feeder gateway URL', process.env.STARKNET_FEEDER_GATEWAY_URL)
    .option('--wallet <wallet>', 'The name of the wallet, including the python module and wallet class', process.env.STARKNET_WALLET)
    .action(starknetCli_1.runStarknetNewAccount);
const blue = chalk_1.default.bold.blue;
const green = chalk_1.default.bold.green;
exports.program
    .command('version')
    .description('Warp version')
    .action(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pjson = require('../package.json');
    const sh = async (cmd) => {
        return new Promise(function (resolve, reject) {
            (0, child_process_1.exec)(cmd, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ stdout, stderr });
                }
            });
        });
    };
    const starknetVersion = await (await sh('starknet --version')).stdout;
    console.log(blue(`Warp Version `) + green(pjson.version));
    console.log(blue(`Starknet Version `) + green(starknetVersion.split(' ')[1]));
});
//# sourceMappingURL=cli.js.map