import { ASTNode, Expression, VariableDeclaration, TypeNode, InferType } from 'solc-typed-ast';
/**
 * Return the `TypeNode` corresponding to `node`, where `node` is an AST node
 * with a type string (`Expression` or `VariableDeclaration`).
 *
 * The function uses a parser to process the type string,
 * while resolving and user-defined type references in the context of `node`.
 *
 * @param arg - an AST node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed between 0.4.x and 0.5.x.
 */
export declare function getNodeType(node: Expression | VariableDeclaration, inference: InferType): TypeNode;
/**
 * Return the `TypeNode` corresponding to `arg`, where `arg` is either a raw type string,
 * or an AST node with a type string (`Expression` or `VariableDeclaration`).
 *
 * The function uses a parser to process the type string,
 * while resolving and user-defined type references in the context of `ctx`.
 *
 * @param arg - either a type string, or a node with a type string (`Expression` or `VariableDeclaration`)
 * @param version - compiler version to be used. Useful as resolution rules changed between 0.4.x and 0.5.x.
 * @param ctx - `ASTNode` representing the context in which a type string is to be parsed
 */
export declare function getNodeTypeInCtx(arg: Expression | VariableDeclaration | string, inference: InferType, ctx: ASTNode): TypeNode;
export interface IFilePosition {
    offset: number;
    line: number;
    column: number;
}
export interface IFileRange {
    start: IFilePosition;
    end: IFilePosition;
    source: string;
}
export interface ILiteralExpectation {
    type: 'literal';
    text: string;
    ignoreCase: boolean;
}
export interface IClassParts extends Array<string | IClassParts> {
}
export interface IClassExpectation {
    type: 'class';
    parts: IClassParts;
    inverted: boolean;
    ignoreCase: boolean;
}
export interface IAnyExpectation {
    type: 'any';
}
export interface IEndExpectation {
    type: 'end';
}
export interface IOtherExpectation {
    type: 'other';
    description: string;
}
export declare type Expectation = ILiteralExpectation | IClassExpectation | IAnyExpectation | IEndExpectation | IOtherExpectation;
export declare class SyntaxError extends Error {
    static buildMessage(expected: Expectation[], found: string | null): string;
    message: string;
    expected: Expectation[];
    found: string | null;
    location: IFileRange;
    name: string;
    constructor(message: string, expected: Expectation[], found: string | null, location: IFileRange);
    format(sources: {
        source: string;
        text: string;
    }[]): string;
}
export interface ICached {
    nextPos: number;
    result: any;
}
export interface IParseOptions {
    filename?: string;
    startRule?: string;
    tracer?: any;
    [key: string]: any;
}
export declare type ParseFunction = (input: string, options?: IParseOptions) => any;
export declare const parse: ParseFunction;
//# sourceMappingURL=typeStringParser.d.ts.map