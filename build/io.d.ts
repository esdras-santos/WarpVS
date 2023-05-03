import { OutputOptions, TranspilationOptions } from './cli';
import { AST } from './ast/ast';
export declare function isValidSolFile(path: string, printError?: boolean): boolean;
export declare function findSolSourceFilePaths(targetPath: string, recurse: boolean): string[];
export declare function findCairoSourceFilePaths(targetPath: string, recurse: boolean): string[];
export declare function findAllFiles(targetPath: string, recurse: boolean): string[];
export declare function replaceSuffix(filePath: string, suffix: string): string;
export declare function outputResult(contractName: string, outputPath: string, code: string, options: OutputOptions & TranspilationOptions, ast: AST): void;
//# sourceMappingURL=io.d.ts.map