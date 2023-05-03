import { Expression, FunctionCall, TypeNode, TypeName } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class StorageReadGen extends StringIndexedFuncGen {
    gen(storageLocation: Expression, typeName?: TypeName): FunctionCall;
    getOrCreateFuncDef(valueType: TypeNode, typeName?: TypeName): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=storageRead.d.ts.map