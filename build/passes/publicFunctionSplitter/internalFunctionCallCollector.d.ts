import { FunctionCall, FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class InternalFunctionCallCollector extends ASTMapper {
    internalFunctionCallSet: Set<FunctionDefinition>;
    constructor(internalFunctionCallSet: Set<FunctionDefinition>);
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=internalFunctionCallCollector.d.ts.map