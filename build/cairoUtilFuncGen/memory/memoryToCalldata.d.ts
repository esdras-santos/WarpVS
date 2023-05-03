import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { ExternalDynArrayStructConstructor } from '../calldata/externalDynArray/externalDynArrayStructConstructor';
import { MemoryReadGen } from './memoryRead';
export declare class MemoryToCallDataGen extends StringIndexedFuncGen {
    private dynamicArrayStructGen;
    private memoryReadGen;
    constructor(dynamicArrayStructGen: ExternalDynArrayStructConstructor, memoryReadGen: MemoryReadGen, ast: AST, sourceUnit: SourceUnit);
    gen(node: Expression): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private createDynArrayReader;
    private generateElementCopyCode;
}
//# sourceMappingURL=memoryToCalldata.d.ts.map