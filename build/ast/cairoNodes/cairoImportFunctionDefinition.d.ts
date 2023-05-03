import { ParameterList } from 'solc-typed-ast';
import { CairoFunctionDefinition, FunctionStubKind } from './cairoFunctionDefinition';
import { Implicits } from '../../utils/utils';
export declare class CairoImportFunctionDefinition extends CairoFunctionDefinition {
    path: string[];
    constructor(id: number, src: string, scope: number, name: string, path: string[], implicits: Set<Implicits>, parameters: ParameterList, returnParameters: ParameterList, stubKind: FunctionStubKind, acceptsRawDArray?: boolean, acceptsUnpackedStructArray?: boolean);
}
//# sourceMappingURL=cairoImportFunctionDefinition.d.ts.map