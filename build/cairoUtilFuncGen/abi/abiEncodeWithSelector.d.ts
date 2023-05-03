import { SourceUnit, TypeNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { GeneratedFunctionInfo } from '../base';
import { AbiEncode } from './abiEncode';
import { AbiBase } from './base';
export declare class AbiEncodeWithSelector extends AbiBase {
    protected functionName: string;
    protected abiEncode: AbiEncode;
    constructor(abiEncode: AbiEncode, ast: AST, sourceUnit: SourceUnit);
    getOrCreate(types: TypeNode[]): GeneratedFunctionInfo;
}
//# sourceMappingURL=abiEncodeWithSelector.d.ts.map