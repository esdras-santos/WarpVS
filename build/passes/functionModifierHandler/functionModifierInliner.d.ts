import { FunctionDefinition, ParameterList, PlaceholderStatement, Return, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class FunctionModifierInliner extends ASTMapper {
    currentFunction: FunctionDefinition;
    parameters: VariableDeclaration[];
    returnParameters: ParameterList;
    constructor(node: FunctionDefinition, parameters: VariableDeclaration[], retParams: ParameterList);
    visitPlaceholderStatement(node: PlaceholderStatement, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
}
//# sourceMappingURL=functionModifierInliner.d.ts.map