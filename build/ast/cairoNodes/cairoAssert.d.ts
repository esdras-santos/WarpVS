import { ASTNode, Expression } from 'solc-typed-ast';
export declare class CairoAssert extends Expression {
    assertMessage: string | null;
    vExpression: Expression;
    constructor(id: number, src: string, expression: Expression, assertMessage?: string | null, raw?: unknown);
    get children(): readonly ASTNode[];
}
//# sourceMappingURL=cairoAssert.d.ts.map