import { Range, TypeNode } from 'solc-typed-ast';
export declare class ModuleType extends TypeNode {
    readonly path: string;
    constructor(path: string, src?: Range);
    pp(): string;
}
//# sourceMappingURL=moduleType.d.ts.map