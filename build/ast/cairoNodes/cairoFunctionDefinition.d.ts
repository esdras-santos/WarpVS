import { Block, FunctionDefinition, FunctionKind, FunctionStateMutability, FunctionVisibility, ModifierInvocation, OverrideSpecifier, ParameterList, StructuredDocumentation } from 'solc-typed-ast';
import { Implicits } from '../../utils/utils';
export declare enum FunctionStubKind {
    None = 0,
    FunctionDefStub = 1,
    StorageDefStub = 2,
    StructDefStub = 3
}
export declare class CairoFunctionDefinition extends FunctionDefinition {
    implicits: Set<Implicits>;
    functionStubKind: FunctionStubKind;
    acceptsRawDarray: boolean;
    acceptsUnpackedStructArray: boolean;
    constructor(id: number, src: string, scope: number, kind: FunctionKind, name: string, virtual: boolean, visibility: FunctionVisibility, stateMutability: FunctionStateMutability, isConstructor: boolean, parameters: ParameterList, returnParameters: ParameterList, modifiers: ModifierInvocation[], implicits: Set<Implicits>, functionStubKind?: FunctionStubKind, acceptsRawDArray?: boolean, acceptsUnpackedStructArray?: boolean, overrideSpecifier?: OverrideSpecifier, body?: Block, documentation?: string | StructuredDocumentation, nameLocation?: string, raw?: unknown);
}
//# sourceMappingURL=cairoFunctionDefinition.d.ts.map