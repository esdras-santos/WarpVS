import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { StringIndexedFuncGenWithAuxiliar } from '../base';
import { MemoryWriteGen } from '../memory/memoryWrite';
export declare class AbiDecode extends StringIndexedFuncGenWithAuxiliar {
    protected functionName: string;
    protected memoryWrite: MemoryWriteGen;
    constructor(memoryWrite: MemoryWriteGen, ast: AST, sourceUnit: SourceUnit);
    gen(expressions: Expression[]): FunctionCall;
    getOrCreateFuncDef(types: TypeNode[]): CairoFunctionDefinition;
    private getOrCreate;
    getOrCreateDecoding(type: TypeNode): CairoFunctionDefinition;
    /**
     * Given a type it generates the arguments and function to decode such type from a warp memory byte array
     * @param type type to decode
     * @param newIndexVar cairo var to store new index position after decoding the type
     * @param decodeResult cairo var that stores the result of the decoding
     * @param relativeIndexVar cairo var to handle offset values
     * @returns the generated code and functions called
     */
    generateDecodingCode(type: TypeNode, newIndexVar: string, decodeResult: string, relativeIndexVar: string): [string, CairoFunctionDefinition[]];
    private createStaticArrayDecoding;
    private createDynamicArrayDecoding;
    private createStructDecoding;
    private createStringBytesDecoding;
    private createValueTypeDecoding;
}
//# sourceMappingURL=abiDecode.d.ts.map