import { ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoContract } from '../../ast/cairoNodes';
import { CairoASTNodeWriter } from '../base';
export declare class CairoContractWriter extends CairoASTNodeWriter {
    writeInner(node: CairoContract, writer: ASTWriter): SrcDesc;
    writeWhole(node: CairoContract, writer: ASTWriter): SrcDesc;
    private writeContractInterface;
}
//# sourceMappingURL=cairoContractWriter.d.ts.map