import { SourceUnit } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class SourceUnitPathFixer extends ASTMapper {
    private includePaths;
    constructor(includePaths: string[]);
    visitSourceUnit(node: SourceUnit, _ast: AST): void;
    static map_(ast: AST, includePaths: string[]): AST;
}
//# sourceMappingURL=sourceUnitPathFixer.d.ts.map