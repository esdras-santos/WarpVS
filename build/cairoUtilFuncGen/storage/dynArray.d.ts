import { ArrayType, BytesType, FunctionCall, MemberAccess, StringType, TypeNode } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
export declare class DynArrayGen extends StringIndexedFuncGen {
    genLength(node: MemberAccess, arrayType: ArrayType | BytesType | StringType): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): [CairoFunctionDefinition, CairoFunctionDefinition];
    private getOrCreate;
}
//# sourceMappingURL=dynArray.d.ts.map