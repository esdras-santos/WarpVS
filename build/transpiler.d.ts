import { PrintOptions, TranspilationOptions } from './cli';
import { AST } from './ast/ast';
declare type CairoSource = [file: string, source: string];
export declare function transpile(ast: AST, options: TranspilationOptions & PrintOptions): CairoSource[];
export declare function transform(ast: AST, options: TranspilationOptions & PrintOptions): CairoSource[];
export declare function handleTranspilationError(e: unknown): void;
export {};
//# sourceMappingURL=transpiler.d.ts.map