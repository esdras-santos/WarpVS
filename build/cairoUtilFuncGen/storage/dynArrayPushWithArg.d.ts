import { DataLocation, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { StringIndexedFuncGen } from '../base';
import { MemoryToStorageGen } from '../memory/memoryToStorage';
import { DynArrayGen } from './dynArray';
import { StorageWriteGen } from './storageWrite';
import { StorageToStorageGen } from './copyToStorage';
import { CalldataToStorageGen } from '../calldata/calldataToStorage';
import { ImplicitArrayConversion } from '../calldata/implicitArrayConversion';
export declare class DynArrayPushWithArgGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageWrite;
    private memoryToStorage;
    private storageToStorage;
    private calldataToStorage;
    private calldataToStorageConversion;
    constructor(dynArrayGen: DynArrayGen, storageWrite: StorageWriteGen, memoryToStorage: MemoryToStorageGen, storageToStorage: StorageToStorageGen, calldataToStorage: CalldataToStorageGen, calldataToStorageConversion: ImplicitArrayConversion, ast: AST, sourceUnit: SourceUnit);
    gen(push: FunctionCall): FunctionCall;
    getOrCreateFuncDef(arrayType: TypeNode, argType: TypeNode, argLoc: DataLocation | undefined): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=dynArrayPushWithArg.d.ts.map