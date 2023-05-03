import { FunctionCall, FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoGeneratedFunctionDefinition } from '../../ast/cairoNodes/cairoGeneratedFunctionDefinition';
import { ASTMapper } from '../../ast/mapper';
export declare class CallGraphBuilder extends ASTMapper {
    callGraph: Map<number, Set<number>>;
    functionId: Map<number, FunctionDefinition>;
    currentFunction: FunctionDefinition | undefined;
    constructor();
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitCairoGeneratedFunctionDefinition(node: CairoGeneratedFunctionDefinition, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    getFunctionGraph(): Map<number, FunctionDefinition[]>;
}
//# sourceMappingURL=callGraph.d.ts.map