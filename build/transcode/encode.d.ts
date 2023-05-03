import { ParamType } from 'ethers/lib/utils';
import { SolValue } from './utils';
export declare function encodeInputs(filePath: string, func: string, useCairoABI: boolean, rawInputs?: string[]): Promise<[string, string]>;
export declare function encode(types: ParamType[], inputs: SolValue[]): string[];
export declare function encodeParams(types: ParamType[], inputs: IterableIterator<SolValue>): string[];
export declare function encode_(type: ParamType, inputs: IterableIterator<SolValue>): string[];
export declare function encodeComplex(type: ParamType, inputs: IterableIterator<SolValue>): string[];
export declare function makeIterator<T>(value: T): IterableIterator<T>;
export declare function encodeAsUintOrFelt(tp: string, inputs: IterableIterator<SolValue>, nbits: number): string[];
//# sourceMappingURL=encode.d.ts.map