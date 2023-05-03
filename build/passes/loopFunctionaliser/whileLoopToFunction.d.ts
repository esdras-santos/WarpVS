import { DoWhileStatement, FunctionDefinition, WhileStatement } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class WhileLoopToFunction extends ASTMapper {
    private loopToContinueFunction;
    private loopFnCounter;
    constructor(loopToContinueFunction: Map<number, FunctionDefinition>, loopFnCounter: {
        count: number;
    });
    loopToFunction(node: WhileStatement | DoWhileStatement, ast: AST): void;
    visitWhileStatement(node: WhileStatement, ast: AST): void;
    visitDoWhileStatement(node: DoWhileStatement, ast: AST): void;
}
//# sourceMappingURL=whileLoopToFunction.d.ts.map