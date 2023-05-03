import { SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { GeneratedFunctionInfo } from '../base';
import { MemoryReadGen } from '../memory/memoryRead';
import { AbiBase } from './base';
/**
 * Given any data type produces the same output of solidity abi.encode
 * in the form of an array of felts where each element represents a byte
 */
export declare class AbiEncode extends AbiBase {
    protected functionName: string;
    protected memoryRead: MemoryReadGen;
    constructor(memoryRead: MemoryReadGen, ast: AST, sourceUnit: SourceUnit);
    getOrCreate(types: TypeNode[]): GeneratedFunctionInfo;
    /**
     * Given a type generate a function that abi-encodes it
     * @param type type to encode
     * @returns the name of the generated function
     */
    getOrCreateEncoding(type: TypeNode): CairoFunctionDefinition;
    /**
     * Given a type it generates the function to encodes it, as well as all other
     * instructions required to use it.
     * @param type type to encode
     * @param newIndexVar cairo var where the updated index should be stored
     * @param newOffsetVar cairo var where the updated offset should be stored
     * @param elementOffset used to calculate the relative offset of dynamically sized types
     * @param varToEncode variable that holds the values to encode
     * @returns instructions to encode `varToEncode`
     */
    generateEncodingCode(type: TypeNode, newIndexVar: string, newOffsetVar: string, elementOffset: string, varToEncode: string): [string, CairoFunctionDefinition[]];
    private createDynamicArrayHeadEncoding;
    private createDynamicArrayTailEncoding;
    private createStaticArrayHeadEncoding;
    private createArrayInlineEncoding;
    private createStructHeadEncoding;
    private createStructInlineEncoding;
    private createStringOrBytesHeadEncoding;
    private createValueTypeHeadEncoding;
    protected readMemory(type: TypeNode, arg: string): [string, CairoFunctionDefinition];
}
//# sourceMappingURL=abiEncode.d.ts.map