import { ParamType, Result } from 'ethers/lib/utils';
export declare function decodeOutputs(filePath: string, func: string, rawOutputs?: string[]): Promise<Result>;
export declare function decode_(types: ParamType[], outputs: IterableIterator<string>): Result;
export declare function decodeComplex(type: ParamType, outputs: IterableIterator<string>): Result;
//# sourceMappingURL=decode.d.ts.map