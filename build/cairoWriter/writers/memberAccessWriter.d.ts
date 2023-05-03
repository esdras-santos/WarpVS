import { ASTWriter, MemberAccess, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class MemberAccessWriter extends CairoASTNodeWriter {
    writeInner(node: MemberAccess, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=memberAccessWriter.d.ts.map