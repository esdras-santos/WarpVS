import { DoWhileStatement, FunctionCall, FunctionDefinition, VariableDeclaration, WhileStatement } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
export declare function extractWhileToFunction(node: WhileStatement, variables: VariableDeclaration[], loopToContinueFunction: Map<number, FunctionDefinition>, ast: AST, loopFnCounter: number, prefix?: string): FunctionDefinition;
export declare function extractDoWhileToFunction(node: DoWhileStatement, variables: VariableDeclaration[], loopToContinueFunction: Map<number, FunctionDefinition>, ast: AST, loopFnCounter: number): FunctionDefinition;
export declare function createLoopCall(loopFunction: FunctionDefinition, variables: VariableDeclaration[], ast: AST): FunctionCall;
//# sourceMappingURL=utils.d.ts.map