export interface Class<T> {
    new (...x: never[]): T;
}
export declare function notNull<T>(x: T | null): x is T;
export declare function notUndefined<T>(x: T | undefined): x is T;
//# sourceMappingURL=typeConstructs.d.ts.map