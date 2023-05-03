import { ASTWriter, Identifier, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class IdentifierWriter extends CairoASTNodeWriter {
    writeInner(node: Identifier, _: ASTWriter): SrcDesc;
}
//# sourceMappingURL=identifierWriter.d.ts.map