import { Expression, FunctionCall, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class StorageWriteGen extends StringIndexedFuncGen {
    gen(storageLocation: Expression, writeValue: Expression): FunctionCall;
    getOrCreateFuncDef(typeToWrite: TypeNode): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=storageWrite.d.ts.map