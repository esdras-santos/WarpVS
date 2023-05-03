import { ASTWriter, Block, UncheckedBlock, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class BlockWriter extends CairoASTNodeWriter {
    writeInner(node: Block | UncheckedBlock, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=blockWriter.d.ts.map