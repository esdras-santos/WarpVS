import { ASTNode, EventDefinition, FunctionDefinition, ModifierDefinition, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoContract } from '../../ast/cairoNodes';
export declare function getBaseContracts(node: CairoContract): CairoContract[];
export declare function updateReferencedDeclarations(node: ASTNode, idRemapping: Map<number, VariableDeclaration | FunctionDefinition | ModifierDefinition>, idRemappingOverriders: Map<number, VariableDeclaration | FunctionDefinition | ModifierDefinition>, ast: AST): void;
export declare function updateReferenceEmitStatements(node: ASTNode, idRemapping: Map<number, EventDefinition>, ast: AST): void;
export declare function removeBaseContractDependence(node: CairoContract): void;
export declare function fixSuperReference(node: ASTNode, base: CairoContract, contract: CairoContract): void;
//# sourceMappingURL=utils.d.ts.map