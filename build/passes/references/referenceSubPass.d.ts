import { Expression, DataLocation, ASTNode } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ReferenceSubPass extends ASTMapper {
    protected actualDataLocations: Map<Expression, DataLocation>;
    protected expectedDataLocations: Map<Expression, DataLocation>;
    constructor(actualDataLocations: Map<Expression, DataLocation>, expectedDataLocations: Map<Expression, DataLocation>);
    protected getLocations(node: Expression): [actual: DataLocation | undefined, expected: DataLocation | undefined];
    protected replace(oldNode: Expression, newNode: Expression, parent: ASTNode | undefined, actualLoc: DataLocation | undefined, expectedLoc: DataLocation | undefined, ast: AST): void;
}
//# sourceMappingURL=referenceSubPass.d.ts.map