import { TypeNode } from 'solc-typed-ast';
import { AST } from '../ast/ast';
export declare enum TypeConversionContext {
    MemoryAllocation = 0,
    Ref = 1,
    StorageAllocation = 2,
    CallDataRef = 3
}
export declare abstract class CairoType {
    abstract toString(): string;
    abstract get fullStringRepresentation(): string;
    get typeName(): string;
    abstract get width(): number;
    abstract serialiseMembers(name: string): string[];
    static fromSol(tp: TypeNode, ast: AST, context?: TypeConversionContext): CairoType;
}
export declare class CairoFelt extends CairoType {
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class CairoBool extends CairoType {
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class CairoUint extends CairoType {
    nBits: number;
    constructor(nBits?: number);
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class CairoContractAddress extends CairoType {
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class CairoStruct extends CairoType {
    name: string;
    members: Map<string, CairoType>;
    constructor(name: string, members: Map<string, CairoType>);
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
    offsetOf(memberName: string): number;
}
export declare class CairoDynArray extends CairoStruct {
    name: string;
    ptr_member: CairoType;
    constructor(name: string, ptr_member: CairoType);
    get vPtr(): CairoPointer;
    get vLen(): CairoFelt;
}
export declare class CairoStaticArray extends CairoType {
    type: CairoType;
    size: number;
    constructor(type: CairoType, size: number);
    get fullStringRepresentation(): string;
    toString(): string;
    get typeName(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class CairoPointer extends CairoType {
    to: CairoType;
    constructor(to: CairoType);
    get fullStringRepresentation(): string;
    toString(): string;
    get width(): number;
    serialiseMembers(name: string): string[];
}
export declare class WarpLocation extends CairoFelt {
    get typeName(): string;
    get fullStringRepresentation(): string;
}
export declare class MemoryLocation extends CairoFelt {
}
export declare const CairoUint256: CairoUint;
export declare function generateCallDataDynArrayStructName(elementType: TypeNode, ast: AST): string;
//# sourceMappingURL=cairoTypeSystem.d.ts.map