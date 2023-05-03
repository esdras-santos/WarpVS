import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
import { FunctionCall, FunctionDefinition, VariableDeclaration } from 'solc-typed-ast';
export declare class FixFnCallRef extends ASTMapper {
    private getterFunctions;
    constructor(getterFunctions: Map<VariableDeclaration, FunctionDefinition>);
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=fixFnCallRef.d.ts.map