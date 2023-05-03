import { ArrayType, FunctionCall, Literal, StringType, TupleExpression } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryArrayLiteralGen extends StringIndexedFuncGen {
    stringGen(node: Literal): FunctionCall;
    tupleGen(node: TupleExpression): FunctionCall;
    getOrCreateFuncDef(type: ArrayType | StringType, size: number): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=arrayLiteral.d.ts.map