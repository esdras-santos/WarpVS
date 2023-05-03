import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from '../storage/dynArray';
import { StorageWriteGen } from '../storage/storageWrite';
export declare class CalldataToStorageGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageWriteGen;
    constructor(dynArrayGen: DynArrayGen, storageWriteGen: StorageWriteGen, ast: AST, sourceUnit: SourceUnit);
    gen(storageLocation: Expression, calldataLocation: Expression): FunctionCall;
    getOrCreateFuncDef(calldataType: TypeNode, storageType: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private generateStructCopyInstructions;
}
//# sourceMappingURL=calldataToStorage.d.ts.map