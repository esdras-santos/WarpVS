import { ASTContext, SourceUnit } from 'solc-typed-ast';
import { AST } from '../ast/ast';
/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *
 *  - all reachable nodes belong to the same context, have their parent/sibling set correctly,
 *  - all number id properties of nodes point to a node in the same context
 *  - when a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number property corresponds to the id of the `v` prefixed property.
 *  - most 'v' properties point to direct children of a node
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 *
 * @param unit - source unit to check
 * @param ctx - `ASTContext`s for each of the groups of units
 */
export declare function checkSane(unit: SourceUnit, ctx: ASTContext): void;
/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *  - All reachable nodes belong to the same context, have their parent/sibling set correctly.
 *  - All number id properties of nodes point to a node in the same context.
 *  - When a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number property corresponds to the id of the `v` prefixed property.
 *  - Most 'v' properties point to direct children of a node.
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 */
export declare function isSane(ast: AST, devMode: boolean): boolean;
//# sourceMappingURL=astChecking.d.ts.map