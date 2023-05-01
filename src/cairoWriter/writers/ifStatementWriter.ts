import { ASTWriter, IfStatement, SrcDesc } from 'solc-typed-ast';
import { CairoASTNodeWriter } from '../base';
import { getDocumentation } from '../utils';
import { notUndefined } from '../../utils/typeConstructs';

export class IfStatementWriter extends CairoASTNodeWriter {
  writeInner(node: IfStatement, writer: ASTWriter): SrcDesc {
    const documentation = getDocumentation(node.documentation, writer);
    return [
      [
        documentation,
        `if ${writer.write(node.vCondition)} {`,
        writer.write(node.vTrueBody),
        ...(node.vFalseBody ? ['} else {', writer.write(node.vFalseBody)] : []),
        '}',
      ]
        .filter(notUndefined)
        .flat()
        .join('\n'),
    ];
  }
}
