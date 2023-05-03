import { Implicits } from './utils';
export declare type RawCairoFunctionInfo = {
    name: string;
    implicits: Implicits[];
};
/**
 * Given several Cairo function represented in plain text extracts information from it
 *  @param rawFunctions Multiple cairo functions in a single text
 *  @returns A list of each function information
 */
export declare function parseMultipleRawCairoFunctions(rawFunctions: string): RawCairoFunctionInfo[];
/**
 * Given a Cairo function represented in plain text extracts information from it
 *  @param rawFunction Cairo code
 *  @returns The function implicits and it's name
 */
export declare function getRawCairoFunctionInfo(rawFunction: string): RawCairoFunctionInfo;
//# sourceMappingURL=cairoParsing.d.ts.map