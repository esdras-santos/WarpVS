import { FunctionCall, TupleExpression } from 'solc-typed-ast';
import { ReferenceSubPass } from './referenceSubPass';
import { AST } from '../../ast/ast';
export declare class MemoryAllocations extends ReferenceSubPass {
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitTupleExpression(node: TupleExpression, ast: AST): void;
    allocateMemoryDynArray(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=memoryAllocations.d.ts.map