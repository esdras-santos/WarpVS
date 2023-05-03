import { FunctionCall, Expression, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
import { CairoFunctionDefinition } from '../../export';
export declare class CallDataToMemoryGen extends StringIndexedFuncGen {
    gen(node: Expression): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createDynamicArrayCopyFunction;
    private createStaticArrayCopyFunction;
    private createStructCopyFunction;
}
//# sourceMappingURL=calldataToMemory.d.ts.map