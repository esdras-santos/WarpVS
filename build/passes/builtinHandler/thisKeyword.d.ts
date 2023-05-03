import { FunctionCall, Identifier } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ThisKeyword extends ASTMapper {
    visitIdentifier(node: Identifier, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=thisKeyword.d.ts.map