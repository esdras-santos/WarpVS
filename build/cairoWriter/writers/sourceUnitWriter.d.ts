import { ASTWriter, SourceUnit, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare const interfaceNameMappings: Map<SourceUnit, Map<string, string>>;
export declare let structRemappings: Map<number, string>;
export declare class SourceUnitWriter extends CairoASTNodeWriter {
    writeInner(node: SourceUnit, writer: ASTWriter): SrcDesc;
    private generateInterfaceNameMappings;
}
//# sourceMappingURL=sourceUnitWriter.d.ts.map