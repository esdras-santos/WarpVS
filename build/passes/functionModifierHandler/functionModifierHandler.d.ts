import { FunctionDefinition, ModifierDefinition, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class FunctionModifierHandler extends ASTMapper {
    count: number;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    extractOriginalFunction(node: FunctionDefinition, ast: AST): FunctionDefinition;
    getFunctionFromModifier(node: FunctionDefinition, modifier: ModifierDefinition, functionToCall: FunctionDefinition, ast: AST): FunctionDefinition;
    createInputParameter(v: VariableDeclaration, ast: AST): VariableDeclaration;
    createReturnParameter(v: VariableDeclaration, ast: AST): VariableDeclaration;
}
//# sourceMappingURL=functionModifierHandler.d.ts.map