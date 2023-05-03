import { ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoAssert } from '../../ast/cairoNodes';
import { CairoASTNodeWriter } from '../base';
export declare class CairoAssertWriter extends CairoASTNodeWriter {
    writeInner(node: CairoAssert, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=cairoAssertWriter.d.ts.map