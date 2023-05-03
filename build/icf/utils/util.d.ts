import { StructAbiItemType } from '../abiTypes';
export declare function stringifyStructs(structs: StructAbiItemType[]): string[];
export declare function transformType(type: string, typeToStruct: Map<string, StructAbiItemType>, structToAdd?: Map<string, StructAbiItemType>): string;
export declare function castStatement(lvar: string, rvar: string, type: string, typeToStruct: Map<string, StructAbiItemType>, addedStruct?: Map<string, StructAbiItemType>): string;
export declare function reverseCastStatement(lvar: string, rvar: string, type: string, typeToStruct: Map<string, StructAbiItemType>, addedStruct?: Map<string, StructAbiItemType>): string;
export declare function tupleParser(tuple: string): string[];
export declare function hashType(type: string): string;
//# sourceMappingURL=util.d.ts.map