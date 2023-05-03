import { Expression, FunctionCall, TypeNode } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryReadGen extends StringIndexedFuncGen {
    gen(memoryRef: Expression): FunctionCall;
    getOrCreateFuncDef(typeToRead: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=memoryRead.d.ts.map