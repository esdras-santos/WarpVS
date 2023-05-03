import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
export declare class StorageToMemoryGen extends StringIndexedFuncGen {
    private dynArrayGen;
    constructor(dynArrayGen: DynArrayGen, ast: AST, sourceUnit: SourceUnit);
    gen(node: Expression): FunctionCall;
    getOrCreateFuncDef(type: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private createStructCopyFunction;
    private createStaticArrayCopyFunction;
    private createSmallStaticArrayCopyFunction;
    private createLargeStaticArrayCopyFunction;
    private createDynamicArrayCopyFunction;
    private getIterCopyCode;
    private getRecursiveCopyCode;
}
//# sourceMappingURL=storageToMemory.d.ts.map