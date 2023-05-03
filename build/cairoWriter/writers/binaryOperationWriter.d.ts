import { ASTWriter, BinaryOperation, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class BinaryOperationWriter extends CairoASTNodeWriter {
    writeInner(node: BinaryOperation, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=binaryOperationWriter.d.ts.map