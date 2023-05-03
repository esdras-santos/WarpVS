import { ASTNode, Block, CompileFailedError, ContractDefinition, EtherUnit, Expression, FunctionCall, FunctionDefinition, Identifier, InferType, SourceLocation, SourceUnit, StructDefinition, TimeUnit, TypeName, TypeNode, UncheckedBlock, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { Class } from './typeConstructs';
import { TranspilationOptions } from '../cli';
export declare type Implicits = 'warp_memory';
export declare function divmod(x: bigint, y: bigint): [bigint, bigint];
declare const cairoPrimitiveIntTypes: readonly ["u8", "u16", "u24", "u32", "u40", "u48", "u56", "u64", "u72", "u80", "u88", "u96", "u104", "u112", "u120", "u128", "u136", "u144", "u152", "u160", "u168", "u176", "u184", "u192", "u200", "u208", "u216", "u224", "u232", "u240", "u248", "u256"];
declare type CairoPrimitiveIntType = typeof cairoPrimitiveIntTypes[number];
export declare const isCairoPrimitiveIntType: (x: string) => x is "u8" | "u16" | "u24" | "u32" | "u40" | "u48" | "u56" | "u64" | "u72" | "u80" | "u88" | "u96" | "u104" | "u112" | "u120" | "u128" | "u136" | "u144" | "u152" | "u160" | "u168" | "u176" | "u184" | "u192" | "u200" | "u208" | "u216" | "u224" | "u232" | "u240" | "u248" | "u256";
export declare function primitiveTypeToCairo(typeString: string): CairoPrimitiveIntType | 'felt' | 'ContractAddress';
export declare function union<T>(setA: Set<T>, setB: Set<T>): Set<T>;
export declare function counterGenerator(start?: number): Generator<number, number, unknown>;
export declare function toHexString(stringValue: string): string;
export declare function unitValue(unit?: EtherUnit | TimeUnit): number;
export declare function runSanityCheck(ast: AST, options: TranspilationOptions, passName: string): boolean;
export declare function exactInstanceOf<T extends object>(x: unknown, typeName: Class<T>): x is T;
export declare function extractProperty(propName: string, obj: object): unknown;
export declare function printCompileErrors(e: CompileFailedError): void;
export declare function mapRange<T>(n: number, func: (n: number) => T): T[];
export declare function typeNameFromTypeNode(node: TypeNode, ast: AST): TypeName;
export declare function groupBy<V, K>(arr: V[], groupFunc: (arg: V) => K): Map<K, Set<V>>;
export declare function countNestedMapItems(map: Map<unknown, Map<unknown, unknown>>): number;
export declare function bigintToTwosComplement(val: bigint, width: number): bigint;
export declare function narrowBigInt(n: bigint): number | null;
export declare function narrowBigIntSafe(n: bigint, errorMessage?: string): number;
export declare function isCairoConstant(node: VariableDeclaration): boolean;
export declare function isExternallyVisible(node: FunctionDefinition): boolean;
export declare function toSingleExpression(expressions: Expression[], ast: AST): Expression;
export declare function isNameless(node: FunctionDefinition): boolean;
export declare function splitDarray(scope: number, dArrayVarDecl: VariableDeclaration, ast: AST): [arrayLen: VariableDeclaration, dArrayVarDecl: VariableDeclaration];
export declare function toUintOrFelt(value: bigint, nBits: number): bigint[];
export declare function expressionHasSideEffects(node: Expression): boolean;
export declare function functionAffectsState(node: FunctionCall): boolean;
export declare function mangleStructName(structDef: StructDefinition): string;
export declare function mangleOwnContractInterface(contractOrName: ContractDefinition | string): string;
export declare function isBlock(node: ASTNode): node is Block | UncheckedBlock;
export declare function isExternalCall(node: FunctionCall): boolean;
export declare function isExternalMemoryDynArray(node: Identifier, inference: InferType): boolean;
export declare function isCalldataDynArrayStruct(node: Identifier, inference: InferType): boolean;
/**
 * Given a source file and some nodes, prints them
 * @param source solidity path to file
 * @param locations nodes source locations
 * @param highlightFunc function that highlight the nodes text locations
 * @param surroundingLines lines surrounding highlighted lines
 * @returns text with highlights
 */
export declare function getSourceFromLocations(source: string, locations: SourceLocation[], highlightFunc: (text: string) => string, surroundingLines?: number): string;
export declare function runStarknetClassHash(filePath: string): string;
export declare function getContainingFunction(node: ASTNode): FunctionDefinition;
export declare function getContainingSourceUnit(node: ASTNode): SourceUnit;
export declare const NODE_MODULES_MARKER: string[];
export declare function traverseParent(directory: string, levels: number, markers: string[]): string | null;
export declare function traverseChildren(directory: string, levels: number, markers: string[]): string | null;
export declare function defaultBasePathAndIncludePath(): string[] | null[];
export declare function execSyncAndLog(command: string, commandName: string): void;
export declare function catchExecSyncError(e: any, commandExecuted: string): string;
export {};
//# sourceMappingURL=utils.d.ts.map