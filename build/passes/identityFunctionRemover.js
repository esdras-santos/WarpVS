"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityFunctionRemover = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const utils_1 = require("../utils/utils");
/*
    The purpose of this pass is to remove non externally visible functions which have only
    one statement: a return statement of one or several of its input parameters. It doesn't
    matter if the identifiers in the return statement don't match the order of the input
    parameters. The following are examples of those functions:

    function g(uint256 val) private pure returns (uint256) {
        return val;
    }

    function h(uint256 a, uint256 b) internal pure returns (uint256, uint256) {
        return (b, a);
    }

    This pass identifies such functions, replaces all calls to those functions with their
    return value (updating references of course) and then, removes them all.
*/
class IdentityFunctionRemover extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitFunctionDefinition(node, ast) {
        if (!(0, utils_1.isExternallyVisible)(node) && this.isIdentity(node)) {
            const order = this.getArgsOrder(node);
            this.replaceNodeReferences(node, order, ast);
            // Remove this function
            const parent = node.vScope;
            parent.removeChild(node);
        }
        else
            this.commonVisit(node, ast);
    }
    isIdentity(node) {
        if (node.vBody !== undefined) {
            const statements = node.vBody.vStatements;
            if (statements.length === 1) {
                const stmt = statements[0];
                if (stmt instanceof solc_typed_ast_1.Return) {
                    const retExpr = stmt.vExpression;
                    if (retExpr !== undefined) {
                        if (retExpr instanceof solc_typed_ast_1.Identifier) {
                            return checkParamsLength(node, 1) && checkIdentifierInParams(retExpr, node);
                        }
                        else if (retExpr instanceof solc_typed_ast_1.TupleExpression) {
                            const exprList = retExpr.vOriginalComponents;
                            return (checkParamsLength(node, exprList.length) && allElementsInParams(exprList, node));
                        }
                    }
                }
            }
        }
        return false;
    }
    getArgsOrder(node) {
        (0, assert_1.default)(node.vBody !== undefined, `Expected a Block in ${(0, astPrinter_1.printNode)(node)}, but got undefined instead`);
        (0, assert_1.default)(node.vBody.vStatements.length === 1, `Expected only one statement in ${(0, astPrinter_1.printNode)(node.vBody)}`);
        const stmt = node.vBody.vStatements[0];
        (0, assert_1.default)(stmt instanceof solc_typed_ast_1.Return, `Expected a Return statement but got ${(0, astPrinter_1.printNode)(stmt)} instead`);
        (0, assert_1.default)(stmt.vExpression !== undefined, `Expected a return expression in ${(0, astPrinter_1.printNode)(stmt)}, but got undefined instead`);
        const retExpr = stmt.vExpression;
        if (retExpr instanceof solc_typed_ast_1.Identifier)
            return [0];
        (0, assert_1.default)(retExpr instanceof solc_typed_ast_1.TupleExpression, `Expected TupleExpression, but got ${(0, astPrinter_1.printNode)(retExpr)} instead`);
        const exprList = retExpr.vOriginalComponents;
        return exprList.reduce((res, expr) => [...res, getIndexOf(expr, node)], new Array());
    }
    replaceNodeReferences(node, order, ast) {
        ast.roots.forEach((root) => {
            root.walk((n) => {
                if (n instanceof solc_typed_ast_1.FunctionCall) {
                    const refFunc = n.vReferencedDeclaration;
                    if (refFunc !== undefined && refFunc instanceof solc_typed_ast_1.FunctionDefinition && refFunc === node) {
                        const exprList = order.reduce((res, idx) => [...res, n.vArguments[idx]], new Array());
                        const retExpr = (0, utils_1.toSingleExpression)(exprList, ast);
                        ast.replaceNode(n, retExpr);
                    }
                }
            });
        });
    }
}
exports.IdentityFunctionRemover = IdentityFunctionRemover;
function checkParamsLength(node, length) {
    return node.vParameters.vParameters.length === length;
}
function checkIdentifierInParams(expr, node) {
    return node.vParameters.vParameters.some((param) => param.id === expr.referencedDeclaration);
}
function allElementsInParams(exprList, node) {
    return exprList.every((expr) => {
        if (expr !== null && expr instanceof solc_typed_ast_1.Identifier)
            return checkIdentifierInParams(expr, node);
        else
            return false;
    });
}
function getIndexOf(expr, node) {
    (0, assert_1.default)(expr !== null, `Expected expression but got null instead`);
    (0, assert_1.default)(expr instanceof solc_typed_ast_1.Identifier, `Expected Identifier but got ${(0, astPrinter_1.printNode)(expr)} instead`);
    const parameters = node.vParameters.vParameters;
    const varDec = parameters.find((param) => param.id === expr.referencedDeclaration);
    (0, assert_1.default)(varDec !== undefined, `${(0, astPrinter_1.printNode)(expr)} should be referencing one of the function's parameters`);
    return parameters.indexOf(varDec);
}
//# sourceMappingURL=identityFunctionRemover.js.map