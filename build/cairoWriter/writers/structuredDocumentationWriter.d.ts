import { ASTWriter, SrcDesc, StructuredDocumentation } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class StructuredDocumentationWriter extends CairoASTNodeWriter {
    writeInner(node: StructuredDocumentation, _writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=structuredDocumentationWriter.d.ts.map