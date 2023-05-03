import { ASTWriter, IfStatement, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class IfStatementWriter extends CairoASTNodeWriter {
    writeInner(node: IfStatement, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=ifStatementWriter.d.ts.map