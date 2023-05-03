import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
import { StorageDeleteGen } from './storageDelete';
export declare class StorageToStorageGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageDeleteGen;
    constructor(dynArrayGen: DynArrayGen, storageDeleteGen: StorageDeleteGen, ast: AST, sourceUnit: SourceUnit);
    gen(to: Expression, from: Expression): FunctionCall;
    getOrCreateFuncDef(toType: TypeNode, fromType: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private createStaticToDynamicArrayCopyFunction;
    private createIntegerCopyFunction;
    private createFixedBytesCopyFunction;
    private createValueTypeCopyFunction;
}
//# sourceMappingURL=copyToStorage.d.ts.map