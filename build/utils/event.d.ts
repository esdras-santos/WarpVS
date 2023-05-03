export declare type EventItem = {
    data: string[];
    keys: string[];
    order?: number;
};
export declare function splitInto248BitChunks(data: string): string[];
export declare function join248bitChunks(data: string[]): string[];
export declare type argType = string | argType[];
export declare function warpEventCanonicalSignaturehash256(eventName: string, argTypes: argType[]): {
    low: string;
    high: string;
};
export declare function warpEventSignatureHash256FromString(functionSignature: string): {
    low: string;
    high: string;
};
//# sourceMappingURL=event.d.ts.map