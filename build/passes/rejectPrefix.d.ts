import { ASTNode, ContractDefinition, EventDefinition, FunctionDefinition, StructDefinition, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class RejectPrefix extends ASTMapper {
    forbiddenPrefix: string[];
    rejectedNames: [string, ASTNode][];
    checkNoPrefixMatch(name: string, node: ASTNode): void;
    static map(ast: AST): AST;
    visitStructDefinition(node: StructDefinition, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitContractDefinition(node: ContractDefinition, ast: AST): void;
    visitEventDefinition(node: EventDefinition, ast: AST): void;
}
//# sourceMappingURL=rejectPrefix.d.ts.map