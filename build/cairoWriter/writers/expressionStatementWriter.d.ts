import { ASTWriter, ExpressionStatement, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class ExpressionStatementWriter extends CairoASTNodeWriter {
    newVarCounter: number;
    writeInner(node: ExpressionStatement, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=expressionStatementWriter.d.ts.map