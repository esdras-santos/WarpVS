import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../export';
import { StringIndexedFuncGen } from '../base';
import { DynArrayGen } from '../storage/dynArray';
import { DynArrayIndexAccessGen } from '../storage/dynArrayIndexAccess';
import { StorageWriteGen } from '../storage/storageWrite';
export declare class ImplicitArrayConversion extends StringIndexedFuncGen {
    private storageWriteGen;
    private dynArrayGen;
    private dynArrayIndexAccessGen;
    constructor(storageWriteGen: StorageWriteGen, dynArrayGen: DynArrayGen, dynArrayIndexAccessGen: DynArrayIndexAccessGen, ast: AST, sourceUnit: SourceUnit);
    genIfNecessary(targetExpression: Expression, sourceExpression: Expression): [Expression, boolean];
    gen(lhs: Expression, rhs: Expression): FunctionCall;
    getOrCreateFuncDef(targetType: TypeNode, sourceType: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private staticToStaticArrayConversion;
    private staticToDynamicArrayConversion;
    private dynamicToDynamicArrayConversion;
    private createStaticToStaticCopyCode;
    private createStaticToDynamicCopyCode;
    private createDynamicToDynamicCopyCode;
}
//# sourceMappingURL=implicitArrayConversion.d.ts.map