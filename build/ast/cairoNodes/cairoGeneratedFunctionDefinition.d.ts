import { FunctionDefinition, FunctionKind, FunctionStateMutability, FunctionVisibility, ParameterList } from 'solc-typed-ast';
import { FunctionStubKind } from './cairoFunctionDefinition';
import { CairoRawStringFunctionDefinition } from './cairoRawStringFunctionDefinition';
export declare class CairoGeneratedFunctionDefinition extends CairoRawStringFunctionDefinition {
    /**
     * List of function definitions called by the generated function
     */
    functionsCalled: FunctionDefinition[];
    constructor(id: number, src: string, scope: number, kind: FunctionKind, name: string, visibility: FunctionVisibility, stateMutability: FunctionStateMutability, parameters: ParameterList, returnParameters: ParameterList, functionStubKind: FunctionStubKind, rawStringDefinition: string, functionsCalled: FunctionDefinition[], acceptsRawDArray?: boolean, acceptsUnpackedStructArray?: boolean);
}
//# sourceMappingURL=cairoGeneratedFunctionDefinition.d.ts.map