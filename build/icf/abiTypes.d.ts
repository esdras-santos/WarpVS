export declare type StructAbiItemType = {
    members: {
        name: string;
        offset?: number;
        type: string;
    }[];
    name: string;
    size?: number;
    type: 'struct';
};
export declare type FunctionAbiItemType = {
    inputs: {
        name: string;
        type: string;
    }[];
    name: string;
    outputs: {
        name: string;
        type: string;
    }[];
    stateMutability: string;
    type: 'function';
};
export declare type AbiItemType = StructAbiItemType | FunctionAbiItemType;
export declare type AbiType = AbiItemType[];
//# sourceMappingURL=abiTypes.d.ts.map