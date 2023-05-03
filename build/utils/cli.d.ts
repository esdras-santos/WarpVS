import { ASTMapper } from '../ast/mapper';
export declare function parsePassOrder(order: string | undefined, until: string | undefined, warnings: boolean | undefined, dev: boolean | undefined, passes: Map<string, typeof ASTMapper>): typeof ASTMapper[];
export declare function createPassMap(passes: [key: string, pass: typeof ASTMapper][]): Map<string, typeof ASTMapper>;
export declare function parseClassHash(filePath: string, CLIOutput: string): string;
//# sourceMappingURL=cli.d.ts.map