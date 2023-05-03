import { FunctionCall, StructDefinition, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryStructGen extends StringIndexedFuncGen {
    gen(node: FunctionCall): FunctionCall;
    getOrCreateFuncDef(nodeType: TypeNode, structDef: StructDefinition): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=memoryStruct.d.ts.map