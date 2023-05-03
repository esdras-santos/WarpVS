import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGenWithAuxiliar } from '../base';
import { ExternalDynArrayStructConstructor } from '../calldata/externalDynArray/externalDynArrayStructConstructor';
/**
 * This class generate `encode` cairo util functions with the objective of making
 * a list of values into a single list where all items are felts. For example:
 * Value list: [a : felt, b : Uint256, c : (felt, felt, felt), d_len : felt, d : felt*]
 * Result: [a, b.low, b.high, c[0], c[1], c[2], d_len, d[0], ..., d[d_len - 1]]
 *
 * It generates a different function depending on the amount of expressions
 * and their types. It also generate different auxiliar functions depending
 * on the type to encode.
 *
 * Auxiliar functions can and will be reused if possible between different
 * generated encoding functions. I.e. the auxiliar function to encode felt
 * dynamic arrays will be always the same
 */
export declare class EncodeAsFelt extends StringIndexedFuncGenWithAuxiliar {
    private externalArrayGen;
    constructor(externalArrayGen: ExternalDynArrayStructConstructor, ast: AST, sourceUnit: SourceUnit);
    /**
     * Given a expression list it generates a `encode` cairo function definition
     * and call that serializes the arguments into a list of felts
     * @param expressions expression list
     * @param expectedTypes expected type for each expression of the list
     * @param sourceUnit source unit where the expression is defined
     * @returns a function call that serializes the value of `expressions`
     */
    gen(expressions: Expression[], expectedTypes: TypeNode[]): FunctionCall;
    getOrCreateFuncDef(typesToEncode: TypeNode[]): CairoFunctionDefinition;
    /**
     * Given a type list it generates a `encode` cairo function definition
     * that serializes the arguments into a list of felts
     * @param typesToEncode type list
     * @returns the name of the generated function
     */
    private getOrCreate;
    /**
     * Given a type it generates the appropriate auxiliar encoding function for this specific type.
     * @param type to encode (only arrays and structs allowed)
     * @returns name of the generated function
     */
    private getOrCreateAuxiliar;
    /**
     * Generates cairo code depending on the type. If it is a value type it generates
     * the appropriate instructions. If it is a an array or struct, it generates a function
     * call
     * @param type type to generate encoding code
     * @param currentElementName cairo variable to encode to felt
     * @returns generated code
     */
    private generateEncodeCode;
    private generateDynamicArrayEncodeFunction;
    private generateStructEncodeFunction;
    private generateStaticArrayEncodeFunction;
}
//# sourceMappingURL=encodeToFelt.d.ts.map