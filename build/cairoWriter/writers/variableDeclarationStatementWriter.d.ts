import { ASTWriter, SrcDesc, VariableDeclarationStatement } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class VariableDeclarationStatementWriter extends CairoASTNodeWriter {
    gapVarCounter: number;
    writeInner(node: VariableDeclarationStatement, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=variableDeclarationStatementWriter.d.ts.map