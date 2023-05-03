import { DataLocation, FunctionCall, IndexAccess, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { CairoUtilFuncGenBase } from '../base';
import { DynArrayGen } from './dynArray';
export declare class MappingIndexAccessGen extends CairoUtilFuncGenBase {
    private dynArrayGen;
    private indexAccessFunctions;
    private stringHashFunctions;
    constructor(dynArrayGen: DynArrayGen, ast: AST, sourceUnit: SourceUnit);
    gen(node: IndexAccess): FunctionCall;
    getOrCreateIndexAccessFunction(indexType: TypeNode, nodeType: TypeNode): CairoFunctionDefinition;
    private generateIndexAccess;
    getOrCreateStringHashFunction(indexType: TypeNode, dataLocation: DataLocation): CairoFunctionDefinition;
    private generateStringHashFunction;
}
//# sourceMappingURL=mappingIndexAccess.d.ts.map