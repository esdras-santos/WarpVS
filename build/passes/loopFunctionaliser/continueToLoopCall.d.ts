import { Continue, FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ContinueToLoopCall extends ASTMapper {
    private loopToContinueFunction;
    constructor(loopToContinueFunction: Map<number, FunctionDefinition>);
    visitContinue(node: Continue, ast: AST): void;
}
//# sourceMappingURL=continueToLoopCall.d.ts.map