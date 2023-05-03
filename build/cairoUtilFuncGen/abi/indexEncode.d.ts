import { SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { GeneratedFunctionInfo } from '../base';
import { MemoryReadGen } from '../memory/memoryRead';
import { AbiBase } from './base';
/**
 * It is a special class used for encoding of indexed arguments in events.
 * More info at:
   https://docs.soliditylang.org/en/v0.8.14/abi-spec.html#encoding-of-indexed-event-parameters
 */
export declare class IndexEncode extends AbiBase {
    protected functionName: string;
    protected memoryRead: MemoryReadGen;
    constructor(memoryRead: MemoryReadGen, ast: AST, sourceUnit: SourceUnit);
    getOrCreate(types: TypeNode[]): GeneratedFunctionInfo;
    /**
     * Given a type generate a function that abi-encodes it
     * @param type type to encode
     * @returns the name of the generated function
     */
    getOrCreateEncoding(type: TypeNode, padding?: boolean): CairoFunctionDefinition;
    /**
     * Given a type it generates the function to encodes it, as well as all other
     * instructions required to use it.
     * @param type type to encode
     * @param newIndexVar cairo var where the updated index should be stored
     * @param varToEncode variable that holds the values to encode
     * @returns instructions to encode `varToEncode`
     */
    generateEncodingCode(type: TypeNode, newIndexVar: string, varToEncode: string, padding?: boolean): [string, CairoFunctionDefinition[]];
    private createDynamicArrayHeadEncoding;
    private createDynamicArrayTailEncoding;
    private createStaticArrayHeadEncoding;
    private createArrayInlineEncoding;
    private createStructHeadEncoding;
    private createStructInlineEncoding;
    private createStringOrBytesHeadEncoding;
    private createStringOrBytesHeadEncodingWithoutPadding;
    private createValueTypeHeadEncoding;
    protected readMemory(type: TypeNode, arg: string): [string, CairoFunctionDefinition];
}
//# sourceMappingURL=indexEncode.d.ts.map