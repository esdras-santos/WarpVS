import { ASTNode, Expression, FunctionCall, NewExpression } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class WarnSupportedFeatures extends ASTMapper {
    addressesToAbiEncode: ASTNode[];
    deploySaltOptions: Expression[];
    visitNewExpression(node: NewExpression, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    static map(ast: AST): AST;
}
//# sourceMappingURL=warnSupportedFeatures.d.ts.map