import { ArrayType, BytesType, FunctionCall, SourceUnit } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
export declare class DynArrayPushWithoutArgGen extends StringIndexedFuncGen {
    private dynArrayGen;
    constructor(dynArrayGen: DynArrayGen, ast: AST, sourceUnit: SourceUnit);
    gen(push: FunctionCall): FunctionCall;
    getOrCreateFuncDef(arrayType: ArrayType | BytesType): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=dynArrayPushWithoutArg.d.ts.map