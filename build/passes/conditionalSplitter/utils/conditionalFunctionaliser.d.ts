import { ASTNode, Block, Conditional, Expression, FunctionCall, Identifier, ParameterList, Statement, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../../ast/ast';
export declare function getReturns(variables: Map<VariableDeclaration, Identifier[]>, conditionalReturn: VariableDeclaration[], ast: AST): ParameterList;
export declare function getConditionalReturn(node: Conditional, funcId: number, nameCounter: Generator<number, number, unknown>, ast: AST): VariableDeclaration[];
export declare function getInputs(variables: Map<VariableDeclaration, Identifier[]>, ast: AST): Identifier[];
export declare function getParams(variables: Map<VariableDeclaration, Identifier[]>, ast: AST): ParameterList;
export declare function createFunctionBody(node: Conditional, conditionalReturn: VariableDeclaration[], returns: ParameterList, ast: AST): Block;
export declare function createReturnBody(returns: ParameterList, value: Expression, conditionalReturn: VariableDeclaration[], ast: AST, lookupNode?: ASTNode): Block;
export declare function addStatementsToCallFunction(node: Conditional, conditionalResult: VariableDeclaration[], variables: VariableDeclaration[], funcToCall: FunctionCall, ast: AST): Statement[];
export declare function getNodeVariables(node: Conditional): Map<VariableDeclaration, Identifier[]>;
export declare function getStatementsForVoidConditionals(node: Conditional, variables: VariableDeclaration[], funcToCall: FunctionCall, ast: AST): void;
//# sourceMappingURL=conditionalFunctionaliser.d.ts.map