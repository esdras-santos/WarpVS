import { SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { GeneratedFunctionInfo } from '../base';
import { MemoryReadGen } from '../memory/memoryRead';
import { AbiBase } from './base';
/**
 * Given any data type produces the same output of solidity abi.encodePacked
 * in the form of an array of felts where each element represents a byte
 */
export declare class AbiEncodePacked extends AbiBase {
    protected functionName: string;
    protected memoryRead: MemoryReadGen;
    constructor(memoryRead: MemoryReadGen, ast: AST, sourceUnit: SourceUnit);
    getOrCreate(types: TypeNode[]): GeneratedFunctionInfo;
    getOrCreateEncoding(type: TypeNode): CairoFunctionDefinition;
    private generateEncodingCode;
    private createArrayInlineEncoding;
    private createValueTypeHeadEncoding;
}
//# sourceMappingURL=abiEncodePacked.d.ts.map