import { BinaryOperation, Expression, TypeNode } from 'solc-typed-ast';
import { AST } from '../ast/ast';
export declare const PATH_TO_WARPLIB: string;
export declare type WarplibFunctionInfo = {
    fileName: string;
    imports: string[];
    functions: string[];
};
export declare function forAllWidths<T>(funcGen: (width: number) => T): T[];
export declare function pow2(n: number): bigint;
export declare function uint256(n: bigint | number): string;
export declare function bound(width: number): string;
export declare function mask(width: number): string;
export declare function msb(width: number): string;
export declare function msbAndNext(width: number): string;
export declare function generateFile(warpFunc: WarplibFunctionInfo): void;
export declare function IntxIntFunction(node: BinaryOperation, name: string, appendWidth: 'always' | 'only256' | 'signedOrWide', separateSigned: boolean, unsafe: boolean, ast: AST): void;
export declare function Comparison(node: BinaryOperation, name: string, appendWidth: 'only256' | 'signedOrWide', separateSigned: boolean, ast: AST): void;
export declare function IntFunction(node: Expression, argument: Expression, name: string, fileName: string, ast: AST): void;
export declare function getIntOrFixedByteBitWidth(type: TypeNode): number;
//# sourceMappingURL=utils.d.ts.map