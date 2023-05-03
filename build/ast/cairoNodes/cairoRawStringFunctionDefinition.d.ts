import { FunctionKind, FunctionStateMutability, FunctionVisibility, ParameterList } from 'solc-typed-ast';
import { CairoFunctionDefinition, FunctionStubKind } from './cairoFunctionDefinition';
export declare class CairoRawStringFunctionDefinition extends CairoFunctionDefinition {
    rawStringDefinition: string;
    constructor(id: number, src: string, scope: number, kind: FunctionKind, name: string, visibility: FunctionVisibility, stateMutability: FunctionStateMutability, parameters: ParameterList, returnParameters: ParameterList, functionSutbKind: FunctionStubKind, rawStringDefinition: string, acceptsRawDArray?: boolean, acceptsUnpackedStructArray?: boolean);
}
//# sourceMappingURL=cairoRawStringFunctionDefinition.d.ts.map