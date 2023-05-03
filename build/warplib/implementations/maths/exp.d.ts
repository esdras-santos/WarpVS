import { BinaryOperation } from 'solc-typed-ast';
import { AST } from '../../../ast/ast';
import { WarplibFunctionInfo } from '../../utils';
export declare function exp(): WarplibFunctionInfo;
export declare function exp_signed(): WarplibFunctionInfo;
export declare function exp_unsafe(): WarplibFunctionInfo;
export declare function exp_signed_unsafe(): WarplibFunctionInfo;
export declare function functionaliseExp(node: BinaryOperation, unsafe: boolean, ast: AST): void;
//# sourceMappingURL=exp.d.ts.map