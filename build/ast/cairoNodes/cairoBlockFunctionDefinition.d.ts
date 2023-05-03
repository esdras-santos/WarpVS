import { FunctionKind, FunctionStateMutability, FunctionVisibility, ParameterList } from 'solc-typed-ast';
import { CairoRawStringFunctionDefinition } from './cairoRawStringFunctionDefinition';
export declare class CairoBlockFunctionDefinition extends CairoRawStringFunctionDefinition {
    constructor(id: number, src: string, scope: number, kind: FunctionKind, name: string, visibility: FunctionVisibility, stateMutability: FunctionStateMutability, parameters: ParameterList, returnParameters: ParameterList, rawStringDefinition: string);
}
//# sourceMappingURL=cairoBlockFunctionDefinition.d.ts.map