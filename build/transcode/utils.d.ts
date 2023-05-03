import { BigNumberish } from 'ethers';
import { ParamType, Result } from 'ethers/lib/utils';
export declare type SolValue = BigNumberish | boolean | string | {
    [key: string]: SolValue;
} | SolValue[];
export declare type Param = (string | number | Param)[];
export declare type SolParamType = {
    internalType: string;
    name: string;
    type: string;
};
export declare type SolFuncType = {
    inputs: SolParamType[];
    name: string;
    outputs: SolParamType[];
    stateMutability: 'payable' | 'pure' | 'view';
    type: 'function';
};
export declare type SolConstructorType = {
    inputs: SolParamType[];
    stateMutability: 'payable' | 'pure' | 'view';
    type: 'constructor';
};
export declare type SolABIFunction = SolFuncType | SolConstructorType;
export declare function getWidthInFeltsOf(type: ParamType): number;
export declare function isPrimitiveParam(type: ParamType): boolean;
export declare function toUintOrFelt(value: bigint, nBits: number): bigint[];
export declare function bigintToTwosComplement(val: bigint, width: number): bigint;
export declare function twosComplementToBigInt(val: bigint, width: number): bigint;
export declare function safeNext<T>(iter: IterableIterator<T>): T;
export declare function normalizeAddress(address: string): string;
export declare function parseParam(param: string): Param;
export declare function parseSolAbi(filePath: string): [];
export declare function selectSignature(abi: SolABIFunction[], funcName: string): Promise<SolABIFunction>;
export declare function decodedOutputsToString(outputs: Result): string;
//# sourceMappingURL=utils.d.ts.map