import { ArrayType, Expression, FunctionCall, TypeNode } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { GeneratedFunctionInfo, StringIndexedFuncGenWithAuxiliar } from '../base';
export declare abstract class AbiBase extends StringIndexedFuncGenWithAuxiliar {
    protected functionName: string;
    gen(expressions: Expression[]): FunctionCall;
    getOrCreateFuncDef(types: TypeNode[]): CairoFunctionDefinition;
    getOrCreate(_types: TypeNode[]): GeneratedFunctionInfo;
    getOrCreateEncoding(_type: TypeNode): CairoFunctionDefinition;
}
/**
 * Returns a static array type string without the element
 * information
 * e.g.
 *    uint8[20] -> uint8[]
 *    uint[][8] -> uint[][]
 *    uint[10][15] -> uint[10][]
 *  @param type a static ArrayType
 *  @returns static array without length information
 */
export declare function removeSizeInfo(type: ArrayType): string;
//# sourceMappingURL=base.d.ts.map