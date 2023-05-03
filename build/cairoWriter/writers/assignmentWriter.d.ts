import { Assignment, ASTWriter, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
export declare class AssignmentWriter extends CairoASTNodeWriter {
    writeInner(node: Assignment, writer: ASTWriter): SrcDesc;
}
//# sourceMappingURL=assignmentWriter.d.ts.map