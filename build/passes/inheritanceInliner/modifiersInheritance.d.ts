import { ModifierDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoContract } from '../../ast/cairoNodes';
export declare function addNonOverriddenModifiers(node: CairoContract, idRemapping: Map<number, ModifierDefinition>, idRemappingOverriders: Map<number, ModifierDefinition>, ast: AST): void;
//# sourceMappingURL=modifiersInheritance.d.ts.map