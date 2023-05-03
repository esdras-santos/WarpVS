import { ASTWriter, IndexAccess, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class IndexAccessWriter extends CairoASTNodeWriter {
    writeInner(node: IndexAccess, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=indexAccessWriter.d.ts.map