import { ASTWriter, Literal, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class LiteralWriter extends CairoASTNodeWriter {
    writeInner(node: Literal, _: ASTWriter): SrcDesc;
}
//# sourceMappingURL=literalWriter.d.ts.map