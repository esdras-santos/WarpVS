import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class ReturnInserter extends ASTMapper {
    addInitialPassPrerequisites(): void;
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
}
//# sourceMappingURL=returnInserter.d.ts.map