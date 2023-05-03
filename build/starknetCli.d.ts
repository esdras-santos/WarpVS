import { IDeployProps, ICallOrInvokeProps, IGatewayProps, IOptionalNetwork, IDeployAccountProps, IOptionalDebugInfo, IDeclareOptions, StarknetNewAccountOptions } from './cli';
export declare const BASE_PATH: string;
interface CompileResult {
    success: boolean;
    resultPath?: string;
    abiPath?: string;
    solAbiPath?: string;
    classHash?: string;
}
interface CompileCairo1Result {
    success: boolean;
    outputDir?: string;
}
export declare function compileCairo1(cairoProjectPath: string, debug?: boolean): CompileCairo1Result;
export declare function compileCairo(filePath: string, cairoPath?: string, debugInfo?: IOptionalDebugInfo): CompileResult;
export declare function runStarknetCompile(filePath: string, debug_info: IOptionalDebugInfo): void;
export declare function runStarknetStatus(tx_hash: string, option: IOptionalNetwork & IGatewayProps): void;
export declare function runStarknetDeploy(filePath: string, options: IDeployProps): Promise<void>;
export declare function runStarknetDeployAccount(options: IDeployAccountProps): void;
export declare function runStarknetCallOrInvoke(filePath: string, isCall: boolean, options: ICallOrInvokeProps): Promise<void>;
export declare function runStarknetDeclare(filePath: string, options: IDeclareOptions): void;
export declare function runStarknetNewAccount(options: StarknetNewAccountOptions): void;
export declare function processDeclareCLI(result: string, filePath: string): string;
export {};
//# sourceMappingURL=starknetCli.d.ts.map