import { Expression, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { ExternalDynArrayStructConstructor } from '../calldata/externalDynArray/externalDynArrayStructConstructor';
import { DynArrayGen } from './dynArray';
import { StorageReadGen } from './storageRead';
export declare class StorageToCalldataGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageReadGen;
    private externalDynArrayStructConstructor;
    constructor(dynArrayGen: DynArrayGen, storageReadGen: StorageReadGen, externalDynArrayStructConstructor: ExternalDynArrayStructConstructor, ast: AST, sourceUnit: SourceUnit);
    gen(storageLocation: Expression): import("solc-typed-ast").FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private generateStructCopyInstructions;
}
//# sourceMappingURL=storageToCalldata.d.ts.map