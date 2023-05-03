import { ASTWriter, Return, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class ReturnWriter extends CairoASTNodeWriter {
    writeInner(node: Return, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=returnWriter.d.ts.map