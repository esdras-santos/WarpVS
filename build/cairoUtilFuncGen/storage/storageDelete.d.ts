import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
import { StorageReadGen } from './storageRead';
export declare class StorageDeleteGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageReadGen;
    private creatingFunctions;
    private functionDependencies;
    constructor(dynArrayGen: DynArrayGen, storageReadGen: StorageReadGen, ast: AST, sourceUnit: SourceUnit);
    gen(node: Expression): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private safeGetOrCreateFuncDef;
    private getOrCreate;
    private deleteGeneric;
    private deleteDynamicArray;
    private deleteSmallStaticArray;
    private deleteLargeStaticArray;
    private deleteStruct;
    private deleteNothing;
    private generateStructDeletionCode;
    private generateStaticArrayDeletionCode;
    private processRecursiveDependencies;
    private getId;
}
//# sourceMappingURL=storageDelete.d.ts.map