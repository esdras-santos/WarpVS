import { CompilationOptions } from './cli';
import { AST } from './ast/ast';
export declare function compileSolFiles(files: string[], options: CompilationOptions): AST;
export declare type SolcOutput = {
    result: {
        contracts: {
            [path: string]: {
                [contract: string]: {
                    abi: [{
                        [key: string]: string;
                    }];
                };
            };
        };
        sources: {
            [path: string]: {
                ast: [{
                    [key: string]: string;
                }];
            };
        };
    };
    compilerVersion: string;
};
export declare function compileSolFilesAndExtractContracts(file: string): unknown;
//# sourceMappingURL=solCompile.d.ts.map