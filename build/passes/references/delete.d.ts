import { UnaryOperation } from 'solc-typed-ast';
import { ReferenceSubPass } from './referenceSubPass';
import { AST } from '../../ast/ast';
export declare class StorageDelete extends ReferenceSubPass {
    visitUnaryOperation(node: UnaryOperation, ast: AST): void;
}
//# sourceMappingURL=delete.d.ts.map