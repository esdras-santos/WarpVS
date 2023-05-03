import { Expression, FunctionCall, SourceUnit, TypeNode } from 'solc-typed-ast';
import { GeneratedFunctionInfo } from '../base';
import { AbiEncodeWithSelector } from './abiEncodeWithSelector';
export declare class AbiEncodeWithSignature extends AbiEncodeWithSelector {
    protected functionName: string;
    gen(expressions: Expression[], sourceUnit?: SourceUnit): FunctionCall;
    getOrCreate(types: TypeNode[]): GeneratedFunctionInfo;
}
//# sourceMappingURL=abiEncodeWithSignature.d.ts.map