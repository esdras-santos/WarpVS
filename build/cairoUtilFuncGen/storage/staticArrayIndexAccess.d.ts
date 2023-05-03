import { FunctionCall, IndexAccess, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class StorageStaticArrayIndexAccessGen extends StringIndexedFuncGen {
    gen(node: IndexAccess): FunctionCall;
    getOrCreateFuncDef(arrayType: TypeNode, valueType: TypeNode): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=staticArrayIndexAccess.d.ts.map