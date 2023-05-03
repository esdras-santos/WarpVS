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
//# sourceMappingURL=typeStringParserHeader.d.ts.map