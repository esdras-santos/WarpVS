export declare class RationalLiteral {
    private numerator;
    private denominator;
    constructor(numerator: bigint, denominator: bigint);
    equalValueOf(other: RationalLiteral): boolean;
    greaterThan(other: RationalLiteral): boolean;
    add(other: RationalLiteral): RationalLiteral;
    subtract(other: RationalLiteral): RationalLiteral;
    multiply(other: RationalLiteral): RationalLiteral;
    divideBy(other: RationalLiteral): RationalLiteral;
    exp(other: RationalLiteral): RationalLiteral | null;
    mod(other: RationalLiteral): RationalLiteral;
    shiftLeft(other: RationalLiteral): RationalLiteral | null;
    shiftRight(other: RationalLiteral): RationalLiteral | null;
    bitwiseNegate(): RationalLiteral | null;
    toInteger(): bigint | null;
    toString(): string;
    bitwiseAnd(other: RationalLiteral): RationalLiteral;
    bitwiseOr(other: RationalLiteral): RationalLiteral;
    bitwiseXor(other: RationalLiteral): RationalLiteral;
}
export declare function stringToLiteralValue(value: string): RationalLiteral;
//# sourceMappingURL=rationalLiteral.d.ts.map