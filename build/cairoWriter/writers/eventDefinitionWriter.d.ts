import { ASTWriter, EventDefinition, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class EventDefinitionWriter extends CairoASTNodeWriter {
    writeInner(node: EventDefinition, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=eventDefinitionWriter.d.ts.map