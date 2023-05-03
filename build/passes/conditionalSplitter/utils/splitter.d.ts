import { Assignment, FunctionCall, VariableDeclaration, VariableDeclarationStatement, Block, Return } from 'solc-typed-ast';
import { AST } from '../../../ast/ast';
export declare function splitTupleAssignment(node: Assignment, eGen: Generator<string, string, unknown>, ast: AST): Block;
export declare function splitFunctionCallWithoutReturn(node: FunctionCall, ast: AST): void;
export declare function splitFunctionCallWithReturn(node: FunctionCall, returnType: VariableDeclaration, eGen: Generator<string, string, unknown>, ast: AST): void;
export declare function splitReturnTuple(node: Return, ast: AST): VariableDeclarationStatement;
//# sourceMappingURL=splitter.d.ts.map