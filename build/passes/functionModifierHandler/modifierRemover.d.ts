import { ModifierDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ModifierRemover extends ASTMapper {
    visitModifierDefinition(node: ModifierDefinition, _ast: AST): void;
}
//# sourceMappingURL=modifierRemover.d.ts.map