import { ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoTempVarStatement } from '../../ast/cairoNodes';
import { CairoASTNodeWriter } from '../base';
export declare class CairoTempVarWriter extends CairoASTNodeWriter {
    writeInner(node: CairoTempVarStatement, _writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=cairoTempVarWriter.d.ts.map