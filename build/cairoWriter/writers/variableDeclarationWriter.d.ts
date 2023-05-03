import { ASTWriter, SrcDesc, VariableDeclaration } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class VariableDeclarationWriter extends CairoASTNodeWriter {
    writeInner(node: VariableDeclaration, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=variableDeclarationWriter.d.ts.map