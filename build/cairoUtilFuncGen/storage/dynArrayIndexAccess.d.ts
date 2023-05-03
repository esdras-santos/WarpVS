import { FunctionCall, IndexAccess, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from './dynArray';
export declare class DynArrayIndexAccessGen extends StringIndexedFuncGen {
    private dynArrayGen;
    constructor(dynArrayGen: DynArrayGen, ast: AST, sourceUnit: SourceUnit);
    gen(node: IndexAccess): FunctionCall;
    getOrCreateFuncDef(nodeType: TypeNode, baseType: TypeNode): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=dynArrayIndexAccess.d.ts.map