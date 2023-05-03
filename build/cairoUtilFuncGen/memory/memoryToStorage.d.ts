import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from '../storage/dynArray';
import { StorageDeleteGen } from '../storage/storageDelete';
import { MemoryReadGen } from './memoryRead';
export declare class MemoryToStorageGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private memoryReadGen;
    private storageDeleteGen;
    constructor(dynArrayGen: DynArrayGen, memoryReadGen: MemoryReadGen, storageDeleteGen: StorageDeleteGen, ast: AST, sourceUnit: SourceUnit);
    gen(storageLocation: Expression, memoryLocation: Expression): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createSmallStaticArrayCopyFunction;
    private createLargeStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private generateTupleCopyInstructions;
}
//# sourceMappingURL=memoryToStorage.d.ts.map