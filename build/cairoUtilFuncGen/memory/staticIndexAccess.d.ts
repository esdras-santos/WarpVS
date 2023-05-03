import { ArrayType, FunctionCall, IndexAccess } from 'solc-typed-ast';
import { CairoUtilFuncGenBase } from '../base';
export declare class MemoryStaticArrayIndexAccessGen extends CairoUtilFuncGenBase {
    gen(indexAccess: IndexAccess, arrayType: ArrayType): FunctionCall;
}
//# sourceMappingURL=staticIndexAccess.d.ts.map