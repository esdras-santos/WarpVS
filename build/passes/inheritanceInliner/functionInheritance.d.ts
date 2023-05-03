import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { CairoContract } from '../../ast/cairoNodes';
export declare function addPrivateSuperFunctions(node: CairoContract, idRemapping: Map<number, FunctionDefinition>, idRemappingOverriders: Map<number, FunctionDefinition>, ast: AST): void;
//# sourceMappingURL=functionInheritance.d.ts.map