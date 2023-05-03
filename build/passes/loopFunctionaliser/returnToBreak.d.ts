import { ASTNode, DoWhileStatement, FunctionDefinition, Return, VariableDeclaration, WhileStatement } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ReturnToBreak extends ASTMapper {
    returnFlags: Map<WhileStatement | DoWhileStatement, VariableDeclaration>;
    returnVariables: Map<FunctionDefinition, VariableDeclaration[]>;
    currentOuterLoop: WhileStatement | DoWhileStatement | null;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    visitLoop(node: WhileStatement | DoWhileStatement, ast: AST): void;
    visitWhileStatement(node: WhileStatement, ast: AST): void;
    visitDoWhileStatement(node: DoWhileStatement, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
    createReturnFlag(containingWhile: WhileStatement | DoWhileStatement, ast: AST): VariableDeclaration;
    getReturnFlag(whileStatement: WhileStatement | DoWhileStatement): VariableDeclaration;
    getReturnVariables(node: ASTNode): VariableDeclaration[];
}
//# sourceMappingURL=returnToBreak.d.ts.map