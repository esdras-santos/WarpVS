import { BinaryOperation, FunctionCall, UnaryOperation, UncheckedBlock } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class MathsOperationToFunction extends ASTMapper {
    inUncheckedBlock: boolean;
    visitUncheckedBlock(node: UncheckedBlock, ast: AST): void;
    visitBinaryOperation(node: BinaryOperation, ast: AST): void;
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=mathsOperationToFunction.d.ts.map