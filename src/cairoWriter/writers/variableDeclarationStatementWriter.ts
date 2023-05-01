import assert from 'assert';
import {
  ASTWriter,
  DataLocation,
  FunctionCall,
  generalizeType,
  Identifier,
  IntType,
  SrcDesc,
  TupleType,
  TypeNode,
  VariableDeclaration,
  VariableDeclarationStatement,
} from 'solc-typed-ast';
import { TranspileFailedError } from '../../utils/errors';
import { isDynamicArray, safeGetNodeType } from '../../utils/nodeTypeProcessing';
import { isExternalCall } from '../../utils/utils';
import { CairoASTNodeWriter } from '../base';
import { getDocumentation } from '../utils';

export class VariableDeclarationStatementWriter extends CairoASTNodeWriter {
  gapVarCounter = 0;
  writeInner(node: VariableDeclarationStatement, writer: ASTWriter): SrcDesc {
    assert(
      node.vInitialValue !== undefined,
      'Variables should be initialised. Did you use VariableDeclarationInitialiser?',
    );

    const documentation = getDocumentation(node.documentation, writer);
    const initialValueType = safeGetNodeType(node.vInitialValue, this.ast.inference);

    const assertUnc = `assert(overflow == false, 'Overflow in unchecked block');`;
    let isUnc256 = false;
    let isUnc = false;
    if (node.vInitialValue instanceof FunctionCall) {
      if ((node.vInitialValue as FunctionCall).vExpression instanceof Identifier) {
        const funcName = writer.write(node.vInitialValue);
        if (funcName.includes('_overflow_') || funcName.includes('_overflowing_')) {
          isUnc = true;
          if ((initialValueType as IntType).nBits === 256) {
            isUnc256 = true;
          }
        }
      }
    }

    const matchBlock = (decl: string): string => {
      return [
        `    Result::Ok(${decl}) => (${decl}, false),`,
        `    Result::Err(${decl}) => (${decl}, true),`,
        `}`,
      ].join('\n');
    };

    const getValueN = (n: number): TypeNode => {
      if (initialValueType instanceof TupleType) {
        return initialValueType.elements[n];
      } else if (n === 0) return initialValueType;
      throw new TranspileFailedError(
        `Attempted to extract value at index ${n} of non-tuple return`,
      );
    };

    const getDeclarationForId = (id: number): VariableDeclaration => {
      const declaration = node.vDeclarations.find((decl) => decl.id === id);
      assert(declaration !== undefined, `Unable to find variable declaration for assignment ${id}`);
      return declaration;
    };

    const declarations = node.assignments.flatMap((id, index) => {
      const type = generalizeType(getValueN(index))[0];
      if (
        isDynamicArray(type) &&
        node.vInitialValue instanceof FunctionCall &&
        isExternalCall(node.vInitialValue)
      ) {
        if (id === null) {
          const uniqueSuffix = this.gapVarCounter++;
          return [`__warp_gv_len${uniqueSuffix}`, `__warp_gv${uniqueSuffix}`];
        }
        const declaration = getDeclarationForId(id);
        assert(
          declaration.storageLocation === DataLocation.CallData,
          `WARNING: declaration receiving calldata dynarray has location ${declaration.storageLocation}`,
        );
        const writtenVar = writer.write(declaration);
        return [`${writtenVar}_len`, writtenVar];
      } else {
        if (id === null) {
          return [`__warp_gv${this.gapVarCounter++}`];
        }
        const decl = [writer.write(getDeclarationForId(id))];
        if (isUnc) {
          decl.push('overflow');
        }
        return decl;
      }
    });
    if (declarations.length > 1) {
      return [
        [
          documentation,
          `let (${declarations.join(', ')}) = ${isUnc && !isUnc256 ? 'match ' : ''}${writer.write(
            node.vInitialValue,
          )}${isUnc && !isUnc256 ? `{\n${matchBlock(declarations[0])}` : ''};`,
          isUnc ? assertUnc : '',
        ].join('\n'),
      ];
    }
    return [
      [documentation, `let ${declarations[0]} = ${writer.write(node.vInitialValue)};`].join('\n'),
    ];
  }
}
