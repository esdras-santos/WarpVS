import { ASTNode } from 'solc-typed-ast';
import { CairoImportFunctionDefinition } from '../ast/cairoNodes';
import { AST } from '../ast/ast';
import { ParameterInfo } from './functionGeneration';
export declare function createImport(path: string[], name: string, nodeInSourceUnit: ASTNode, ast: AST, inputs?: ParameterInfo[], outputs?: ParameterInfo[], options?: {
    acceptsRawDarray?: boolean;
    acceptsUnpackedStructArray?: boolean;
}): CairoImportFunctionDefinition;
export declare function encodePath(path: (string | string[])[]): string;
//# sourceMappingURL=importFuncGenerator.d.ts.map