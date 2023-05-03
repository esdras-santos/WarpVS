import { ASTNode, DataLocation, ElementaryTypeName, EventDefinition, Expression, ExpressionStatement, FunctionCall, FunctionDefinition, FunctionStateMutability, Identifier, TypeName, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { CairoImportFunctionDefinition, FunctionStubKind } from '../ast/cairoNodes';
import { CairoGeneratedFunctionDefinition } from '../ast/cairoNodes/cairoGeneratedFunctionDefinition';
import { Implicits } from './utils';
export declare function createCallToFunction(functionDef: FunctionDefinition, argList: Expression[], ast: AST, nodeInSourceUnit?: ASTNode): FunctionCall;
export declare function createCallToEvent(eventDef: EventDefinition, identifierTypeString: string, argList: Expression[], ast: AST): FunctionCall;
interface CairoFunctionStubOptions {
    mutability?: FunctionStateMutability;
    stubKind?: FunctionStubKind;
    acceptsRawDArray?: boolean;
    acceptsUnpackedStructArray?: boolean;
}
export declare type ParameterInfo = [string, TypeName] | [string, TypeName, DataLocation];
export declare function createCairoGeneratedFunction(genFuncInfo: {
    name: string;
    code: string;
    functionsCalled: FunctionDefinition[];
}, inputs: ParameterInfo[], returns: ParameterInfo[], ast: AST, nodeInSourceUnit: ASTNode, options?: CairoFunctionStubOptions): CairoGeneratedFunctionDefinition;
export declare function createCairoImportFunctionDefinition(funcName: string, path: string[], implicits: Set<Implicits>, params: ParameterInfo[], retParams: ParameterInfo[], ast: AST, nodeInSourceUnit: ASTNode, options?: CairoFunctionStubOptions): CairoImportFunctionDefinition;
export declare function createCairoImportStructDefinition(structName: string, path: string[], ast: AST, nodeInSourceUnit: ASTNode): CairoImportFunctionDefinition;
export declare function createElementaryConversionCall(typeTo: ElementaryTypeName, expression: Expression, context: ASTNode, ast: AST): FunctionCall;
export declare function fixParameterScopes(node: FunctionDefinition): void;
export declare function createOuterCall(node: ASTNode, variables: VariableDeclaration[], functionToCall: FunctionCall, ast: AST): ExpressionStatement;
export declare function collectUnboundVariables(node: ASTNode): Map<VariableDeclaration, Identifier[]>;
export {};
//# sourceMappingURL=functionGeneration.d.ts.map