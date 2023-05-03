import { AST } from '../ast/ast';
import { ASTNodeWriter } from 'solc-typed-ast';
export declare abstract class CairoASTNodeWriter extends ASTNodeWriter {
    ast: AST;
    throwOnUnimplemented: boolean;
    constructor(ast: AST, throwOnUnimplemented: boolean);
    logNotImplemented(message: string): void;
}
//# sourceMappingURL=base.d.ts.map