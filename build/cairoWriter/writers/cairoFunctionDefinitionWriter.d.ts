import { ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { CairoASTNodeWriter } from '../base';
export declare class CairoFunctionDefinitionWriter extends CairoASTNodeWriter {
    writeInner(node: CairoFunctionDefinition, writer: ASTWriter): SrcDesc;
    private getDecorator;
    private getName;
    private getBody;
    private getReturns;
    private getConstructorStorageAllocation;
}
//# sourceMappingURL=cairoFunctionDefinitionWriter.d.ts.map