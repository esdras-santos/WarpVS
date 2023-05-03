import { ASTWriter, EmitStatement, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class EmitStatementWriter extends CairoASTNodeWriter {
    writeInner(node: EmitStatement, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=emitStatementWriter.d.ts.map