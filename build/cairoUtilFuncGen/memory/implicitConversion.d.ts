import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { StringIndexedFuncGen } from '../base';
import { MemoryReadGen } from './memoryRead';
import { MemoryWriteGen } from './memoryWrite';
export declare class MemoryImplicitConversionGen extends StringIndexedFuncGen {
    private memoryWrite;
    private memoryRead;
    constructor(memoryWrite: MemoryWriteGen, memoryRead: MemoryReadGen, ast: AST, sourceUnit: SourceUnit);
    genIfNecessary(sourceExpression: Expression, targetType: TypeNode): [Expression, boolean];
    gen(source: Expression, targetType: TypeNode): FunctionCall;
    getOrCreateFuncDef(targetType: TypeNode, sourceType: TypeNode): CairoFunctionDefinition;
    private getOrCreate;
    private staticToStaticArrayConversion;
    private staticToDynamicArrayConversion;
    private dynamicToDynamicArrayConversion;
    private generateScalingCode;
    private generateIntegerScalingCode;
    private generateFixedBytesScalingCode;
}
export declare function getBaseType(type: TypeNode): TypeNode;
//# sourceMappingURL=implicitConversion.d.ts.map