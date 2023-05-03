import { FunctionCall, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryArrayConcat extends StringIndexedFuncGen {
    gen(concat: FunctionCall): FunctionCall;
    getOrCreateFuncDef(argTypes: TypeNode[]): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
    private generateBytesConcat;
    private getSize;
    private getCopyFunctionCall;
}
//# sourceMappingURL=arrayConcat.d.ts.map