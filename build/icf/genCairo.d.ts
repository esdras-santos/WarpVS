import { AbiType, StructAbiItemType } from './abiTypes';
export declare const INDENT = "    ";
export declare function genCairoContract(abi: AbiType, contract_address: string | undefined, class_hash: string | undefined): string;
export declare function getInteractiveFuncs(abi: AbiType, contract_address: string | undefined, class_hash: string | undefined): [string[], string[], StructAbiItemType[], string[], string[], StructAbiItemType[]];
//# sourceMappingURL=genCairo.d.ts.map