import { Command } from 'commander';
export declare type CompilationOptions = {
    warnings?: boolean;
    includePaths?: string[];
    basePath?: string;
};
export declare type TranspilationOptions = {
    checkTrees?: boolean;
    dev: boolean;
    order?: string;
    printTrees?: boolean;
    strict?: boolean;
    warnings?: boolean;
    until?: string;
};
export declare type PrintOptions = {
    highlight?: string[];
    stubs?: boolean;
};
export declare type OutputOptions = {
    compileCairo?: boolean;
    outputDir: string;
    formatCairo: boolean;
};
declare type CliOptions = CompilationOptions & TranspilationOptions & PrintOptions & OutputOptions & IOptionalDebugInfo;
export declare const program: Command;
export declare function runTranspile(files: string[], options: CliOptions): void;
export declare function createCairoProject(filePath: string): void;
export interface IOptionalNetwork {
    network?: string;
}
export interface IOptionalFee {
    max_fee?: number;
}
export interface IOptionalDebugInfo {
    debugInfo: boolean;
}
export interface SolcInterfaceGenOptions {
    cairoPath: string;
    output?: string;
    solcVersion?: string;
    contractAddress?: string;
    classHash?: string;
}
interface IDeployProps_ {
    inputs?: string[];
    use_cairo_abi: boolean;
    no_wallet: boolean;
    wallet?: string;
}
export interface IGatewayProps {
    gateway_url?: string;
    feeder_gateway_url?: string;
}
export declare type IDeployProps = IDeployProps_ & IOptionalNetwork & IOptionalAccount & IOptionalDebugInfo & IGatewayProps & IOptionalFee;
interface IOptionalWallet {
    wallet?: string;
}
interface IOptionalAccount {
    account?: string;
    account_dir?: string;
}
export declare type IDeployAccountProps = IOptionalAccount & IOptionalNetwork & IOptionalWallet & IGatewayProps & IOptionalFee;
interface ICallOrInvokeProps_ {
    address: string;
    function: string;
    inputs?: string[];
    use_cairo_abi: boolean;
}
export declare type ICallOrInvokeProps = ICallOrInvokeProps_ & IOptionalNetwork & IOptionalWallet & IOptionalAccount & IGatewayProps & IOptionalFee;
interface IOptionalVerbose {
    verbose: boolean;
}
interface IInstallOptions_ {
    python: string;
}
export declare type IInstallOptions = IInstallOptions_ & IOptionalVerbose;
export interface IDeclareOptions {
    no_wallet: boolean;
    network?: string;
    wallet?: string;
    account?: string;
    account_dir?: string;
    gateway_url?: string;
    feeder_gateway_url?: string;
    max_fee?: string;
}
export declare type StarknetNewAccountOptions = IOptionalAccount & IOptionalAccount & IOptionalNetwork & IGatewayProps & IOptionalWallet;
export {};
//# sourceMappingURL=cli.d.ts.map