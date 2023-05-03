import { EmitStatement, EventDefinition, FunctionCall, SourceUnit } from 'solc-typed-ast';
import { AST } from '../export';
import { StringIndexedFuncGen } from './base';
import { AbiEncode } from './abi/abiEncode';
import { IndexEncode } from './abi/indexEncode';
export declare const BYTES_IN_FELT_PACKING = 31;
/**
 * Generates a cairo function that emits an event through a cairo syscall.
 * Then replace the emit statement with a call to the generated function.
 */
export declare class EventFunction extends StringIndexedFuncGen {
    private abiEncode;
    private indexEncode;
    constructor(abiEncode: AbiEncode, indexEcnode: IndexEncode, ast: AST, sourceUint: SourceUnit);
    gen(node: EmitStatement, refEventDef: EventDefinition): FunctionCall;
    private getOrCreateFuncDef;
    private getOrCreate;
    private generateAnonymizeCode;
    private generateSimpleEncodingCode;
    private generateComplexEncodingCode;
}
//# sourceMappingURL=event.d.ts.map