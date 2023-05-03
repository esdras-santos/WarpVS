import { Expression, FunctionCall, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryWriteGen extends StringIndexedFuncGen {
    gen(memoryRef: Expression, writeValue: Expression): FunctionCall;
    getOrCreateFuncDef(typeToWrite: TypeNode): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=memoryWrite.d.ts.map