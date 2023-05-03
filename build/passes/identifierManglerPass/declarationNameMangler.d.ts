import { ASTNode, ContractDefinition, ForStatement, FunctionDefinition, SourceUnit, StructDefinition, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare const reservedTerms: Set<string>;
export declare function checkSourceTerms(term: string, node: ASTNode): void;
export declare class DeclarationNameMangler extends ASTMapper {
    nameCounter: number;
    visitSourceUnit(node: SourceUnit, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
    visitForStatement(node: ForStatement, ast: AST): void;
    createNewFunctionName(fd: FunctionDefinition, ast: AST): string;
    createNewVariableName(existingName: string): string;
    checkCollision(node: VariableDeclaration): boolean;
    mangleVariableDeclaration(node: VariableDeclaration): void;
    mangleStructDefinition(node: StructDefinition): void;
    mangleFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    mangleContractDefinition(node: ContractDefinition, ast: AST): void;
}
//# sourceMappingURL=declarationNameMangler.d.ts.map