import { FunctionCall } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ExplicitConversionToFunc extends ASTMapper {
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=explicitConversionToFunc.d.ts.map