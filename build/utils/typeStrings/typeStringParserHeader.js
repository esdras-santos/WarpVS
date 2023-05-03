"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeTypeInCtx = exports.getNodeType = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
function getFunctionAttributes(decorators) {
    let visibility;
    let mutability;
    const visibilities = new Set([
        solc_typed_ast_1.FunctionVisibility.Internal,
        solc_typed_ast_1.FunctionVisibility.External,
        solc_typed_ast_1.FunctionVisibility.Public,
        solc_typed_ast_1.FunctionVisibility.Private,
    ]);
    const mutabilities = new Set([
        solc_typed_ast_1.FunctionStateMutability.Pure,
        solc_typed_ast_1.FunctionStateMutability.View,
        solc_typed_ast_1.FunctionStateMutability.NonPayable,
        solc_typed_ast_1.FunctionStateMutability.Payable,
    ]);
    for (const decorator of decorators) {
        if (visibilities.has(decorator)) {
            if (visibility !== undefined) {
                throw new Error(`Multiple visibility decorators specified: ${decorator} conflicts with ${visibility}`);
            }
            visibility = decorator;
        }
        else if (mutabilities.has(decorator)) {
            if (mutability !== undefined) {
                throw new Error(`Multiple mutability decorators specified: ${decorator} conflicts with ${mutability}`);
            }
            mutability = decorator;
        }
    }
    // Assume default visibility is internal
    if (visibility === undefined) {
        visibility = solc_typed_ast_1.FunctionVisibility.Internal;
    }
    // Assume default mutability is non-payable
    if (mutability === undefined) {
        mutability = solc_typed_ast_1.FunctionStateMutability.NonPayable;
    }
    return [visibility, mutability];
}
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
function getNodeType(node, inference) {
    return parse(node.typeString, { ctx: node, inference });
}
exports.getNodeType = getNodeType;
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
function getNodeTypeInCtx(arg, inference, ctx) {
    const typeString = typeof arg === 'string' ? arg : arg.typeString;
    return parse(typeString, { ctx, inference });
}
exports.getNodeTypeInCtx = getNodeTypeInCtx;
function makeUserDefinedType(name, constructor, inference, ctx) {
    let defs = [...(0, solc_typed_ast_1.resolveAny)(name, ctx, inference)];
    /**
     * Note that constructors below 0.5.0 may have same name as contract definition.
     */
    if (constructor === solc_typed_ast_1.ContractDefinition) {
        defs = defs
            .filter((def) => def instanceof solc_typed_ast_1.ContractDefinition ||
            (def instanceof solc_typed_ast_1.FunctionDefinition && def.isConstructor && def.name === def.vScope.name))
            .map((def) => (def instanceof solc_typed_ast_1.FunctionDefinition ? def.vScope : def));
    }
    else {
        defs = defs.filter((def) => def instanceof constructor);
    }
    if (defs.length === 0) {
        throw new Error(`Couldn't find ${constructor.name} ${name}`);
    }
    if (defs.length > 1) {
        throw new Error(`Multiple matches for ${constructor.name} ${name}`);
    }
    const def = defs[0];
    (0, solc_typed_ast_1.assert)(def instanceof constructor, 'Expected {0} to resolve to {1} got {2} instead', name, constructor.name, def);
    return new solc_typed_ast_1.UserDefinedType(name, def);
}
//# sourceMappingURL=typeStringParserHeader.js.map