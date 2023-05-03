import { ArrayType, BytesType, FunctionCall, SourceUnit, StringType } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
import { StorageDeleteGen } from './storageDelete';
export declare class DynArrayPopGen extends StringIndexedFuncGen {
    private dynArrayGen;
    private storageDelete;
    constructor(dynArrayGen: DynArrayGen, storageDelete: StorageDeleteGen, ast: AST, sourceUnit: SourceUnit);
    gen(pop: FunctionCall): FunctionCall;
    getOrCreateFuncDef(arrayType: ArrayType | BytesType | StringType): CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=dynArrayPop.d.ts.map