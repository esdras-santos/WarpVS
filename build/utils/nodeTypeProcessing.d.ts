import { ArrayType, ASTNode, BytesType, DataLocation, Expression, FunctionCall, FunctionDefinition, InferType, IntType, StringType, TypeName, TypeNode, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
export declare function getParameterTypes(functionCall: FunctionCall, ast: AST): TypeNode[];
export declare function typeNameToSpecializedTypeNode(typeName: TypeName, loc: DataLocation, inference: InferType): TypeNode;
export declare function specializeType(typeNode: TypeNode, loc: DataLocation): TypeNode;
export declare function intTypeForLiteral(typestring: string): IntType;
export declare function isDynamicArray(type: TypeNode): boolean;
export declare function isDynamicCallDataArray(type: TypeNode): boolean;
export declare function isStruct(type: TypeNode): boolean;
export declare function isReferenceType(type: TypeNode): boolean;
export declare function isValueType(type: TypeNode): boolean;
export declare function isDynamicStorageArray(type: TypeNode): boolean;
export declare function isComplexMemoryType(type: TypeNode): boolean;
export declare function isMapping(type: TypeNode): boolean;
export declare function isAddressType(type: TypeNode): boolean;
export declare function hasMapping(type: TypeNode): boolean;
export declare function checkableType(type: TypeNode): boolean;
export declare function getElementType(type: ArrayType | BytesType | StringType): TypeNode;
export declare function getSize(type: ArrayType | BytesType | StringType): bigint | undefined;
export declare function isStorageSpecificType(type: TypeNode, ast: AST, visitedStructs?: number[]): boolean;
export declare function safeGetNodeType(node: Expression | VariableDeclaration, inference: InferType): TypeNode;
export declare function safeGetNodeTypeInCtx(arg: string | VariableDeclaration | Expression, inference: InferType, ctx: ASTNode): TypeNode;
export declare function safeCanonicalHash(f: FunctionDefinition, ast: AST): string;
/**
 * Given a type returns its packed solidity bytes size
 * e.g. uint8 -> byte size is 1
 *      uint16[3] -> byte size is 6
 *      and so on
 *  address are 32 bytes instead of 20 bytes due to size difference
 *  between addresses in Starknet and Ethereum
 *  For every type whose byte size can be known on compile time
 *  @param type Solidity type
 *  @param version required for calculating structs byte size
 *  @returns returns the types byte representation using packed abi encoding
 */
export declare function getPackedByteSize(type: TypeNode, inference: InferType): number | bigint;
/**
 * Given a type returns  solidity bytes size
 * e.g. uint8, bool, address -> byte size is 32
 *      T[] -> byte size is 32
 *      uint16[3] -> byte size is 96
 *      uint16[][3] -> byte size is 32
 *      and so on
 *  @param type Solidity type
 *  @param version parameter required for calculating struct byte size
 *  @returns returns the types byte representation using abi encoding
 */
export declare function getByteSize(type: TypeNode, inference: InferType): number | bigint;
export declare function isDynamicallySized(type: TypeNode, inference: InferType): boolean;
//# sourceMappingURL=nodeTypeProcessing.d.ts.map