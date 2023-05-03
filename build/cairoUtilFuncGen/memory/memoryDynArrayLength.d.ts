import { AST } from '../../ast/ast';
import { MemberAccess, FunctionCall } from 'solc-typed-ast';
import { CairoUtilFuncGenBase } from '../base';
export declare class MemoryDynArrayLengthGen extends CairoUtilFuncGenBase {
    gen(node: MemberAccess, ast: AST): FunctionCall;
}
//# sourceMappingURL=memoryDynArrayLength.d.ts.map