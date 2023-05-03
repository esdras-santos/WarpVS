import { ASTWriter, FunctionCall, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class FunctionCallWriter extends CairoASTNodeWriter {
    writeInner(node: FunctionCall, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=functionCallWriter.d.ts.map