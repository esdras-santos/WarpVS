import { ASTWriter, SrcDesc, TupleExpression } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class TupleExpressionWriter extends CairoASTNodeWriter {
    writeInner(node: TupleExpression, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=tupleExpressionWriter.d.ts.map