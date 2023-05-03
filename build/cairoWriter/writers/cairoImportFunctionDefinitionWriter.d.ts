import { ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoImportFunctionDefinition } from '../../ast/cairoNodes';
import { CairoASTNodeWriter } from '../base';
export declare class CairoImportFunctionDefinitionWriter extends CairoASTNodeWriter {
    writeInner(node: CairoImportFunctionDefinition, _writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=cairoImportFunctionDefinitionWriter.d.ts.map