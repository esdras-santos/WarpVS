import { AbiType, StructAbiItemType } from '../abiTypes';
export declare function getStructsFromABI(abi: AbiType): StructAbiItemType[];
export declare function getAllStructsFromABI(abi: AbiType): StructAbiItemType[];
export declare function getStructDependencyGraph(abi: AbiType): StructAbiItemType[];
export declare function typeToStructMapping(structs: StructAbiItemType[]): Map<string, StructAbiItemType>;
export declare function uint256TransformStructs(structDependency: StructAbiItemType[]): [StructAbiItemType[], string[], Map<string, StructAbiItemType>];
//# sourceMappingURL=struct.d.ts.map