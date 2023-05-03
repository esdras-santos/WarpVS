"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineAssemblyTransformer = void 0;
const mapper_1 = require("../ast/mapper");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const solc_typed_ast_1 = require("solc-typed-ast");
const assert_1 = __importDefault(require("assert"));
const errors_1 = require("../utils/errors");
/*
TODO: Research the difference between div, sdiv, mod, smod, shr, sar
One scenario when the result is different:
int8 r;
int8 a = -1;
int8 b = 2;
assembly {
  r := div(a, b)
}

div returns -1 while sdiv returns 0
*/
const binaryOps = {
    add: '+',
    mul: '*',
    div: '/',
    sub: '-',
    shr: '>>',
    shl: '<<',
    mod: '%',
    exp: '**',
};
// Consider grouping functions by number of arguments. They probably all use uint256 with the only difference being number of args.
const solidityEquivalents = {
    addmod: 'function (uint256,uint256,uint256) pure returns (uint256)',
    mulmod: 'function (uint256,uint256,uint256) pure returns (uint256)',
};
function generateTransformerName(nodeType) {
    return `transform${nodeType}`;
}
class YulVerifier {
    constructor() {
        this.errors = [];
    }
    verifyNode(node) {
        const transformerName = generateTransformerName(node.nodeType);
        if (!(transformerName in YulTransformer.prototype))
            this.errors.push(`${node.nodeType} is not supported`);
        const verifierName = `check${node.nodeType}`;
        const method = this[verifierName];
        if (method !== undefined)
            return method.bind(this)(node);
    }
    checkYulAssignment(node) {
        this.verifyNode(node.value);
    }
    checkYulFunctionCall(node) {
        if (binaryOps[node.functionName.name] === undefined &&
            solidityEquivalents[node.functionName.name] === undefined)
            this.errors.push(`${node.functionName.name} is not supported`);
        node.arguments.forEach((arg) => this.verifyNode(arg));
    }
}
class YulTransformer {
    constructor(ast, externalReferences, context) {
        this.ast = ast;
        const blockRefIds = externalReferences.map((ref) => ref.declaration);
        const blockRefs = [...context.map].filter(([id, _]) => blockRefIds.includes(id));
        this.vars = new Map(blockRefs.map(([_, ref]) => [ref.name, ref]));
    }
    toSolidityStatement(node) {
        return this.toSolidityNode(node);
    }
    toSolidityExpr(node, ...args) {
        return this.toSolidityNode(node, ...args);
    }
    toSolidityNode(node, ...args) {
        const methodName = generateTransformerName(node.nodeType);
        const method = this[methodName];
        return method.bind(this)(node, ...args);
    }
    transformYulLiteral(node) {
        return (0, nodeTemplates_1.createNumberLiteral)(node.value, this.ast);
    }
    transformYulIdentifier(node) {
        const variableDeclaration = this.vars.get(node.name);
        (0, assert_1.default)(variableDeclaration !== undefined, `Variable ${node.name} not found.`);
        return (0, nodeTemplates_1.createIdentifier)(variableDeclaration, this.ast);
    }
    getBinaryOpsArgs(functionName, functionArguments) {
        if (functionName === 'shl' || functionName === 'shr') {
            const [right, left] = functionArguments;
            return [left, right];
        }
        return functionArguments;
    }
    transformYulFunctionCall(node, typeString) {
        const args = node.arguments.map((argument) => this.toSolidityExpr(argument, typeString));
        if (solidityEquivalents[node.functionName.name] !== undefined) {
            const func = new solc_typed_ast_1.Identifier(this.ast.reserveId(), node.src, solidityEquivalents[node.functionName.name], node.functionName.name, -1);
            return new solc_typed_ast_1.FunctionCall(this.ast.reserveId(), node.src, typeString, solc_typed_ast_1.FunctionCallKind.FunctionCall, func, args);
        }
        const [leftExpr, rightExpr] = this.getBinaryOpsArgs(node.functionName.name, args);
        return new solc_typed_ast_1.BinaryOperation(this.ast.reserveId(), node.src, typeString, binaryOps[node.functionName.name], leftExpr, rightExpr, node);
    }
    transformYulAssignment(node) {
        let lhs;
        if (node.variableNames.length === 1) {
            lhs = this.transformYulIdentifier(node.variableNames[0]);
        }
        else {
            lhs = (0, nodeTemplates_1.createTuple)(this.ast, node.variableNames.map((i) => this.transformYulIdentifier(i)));
        }
        const rhs = this.toSolidityExpr(node.value, lhs.typeString);
        const assignment = new solc_typed_ast_1.Assignment(this.ast.reserveId(), node.src, lhs.typeString, '=', lhs, rhs, node);
        return (0, nodeTemplates_1.createExpressionStatement)(this.ast, assignment);
    }
}
class InlineAssemblyTransformer extends mapper_1.ASTMapper {
    yul(node) {
        (0, assert_1.default)(node.yul !== undefined, 'Attribute yul of the InlineAssembly node is undefined');
        return node.yul;
    }
    verify(node, ast) {
        const verifier = new YulVerifier();
        this.yul(node).statements.map((yul) => verifier.verifyNode(yul));
        if (verifier.errors.length === 0)
            return;
        const unsupportedPerSource = new Map();
        const errorsWithNode = verifier.errors.map((msg) => [msg, node]);
        unsupportedPerSource.set(ast.getContainingRoot(node).absolutePath, errorsWithNode);
        const errorMsg = (0, errors_1.getErrorMessage)(unsupportedPerSource, `Detected ${verifier.errors.length} Unsupported Features:`);
        throw new errors_1.WillNotSupportError(errorMsg, undefined, false);
    }
    transform(node, ast) {
        (0, assert_1.default)(node.context !== undefined, `Assembly root context not found.`);
        const transformer = new YulTransformer(ast, node.externalReferences, node.context);
        const statements = this.yul(node).statements.map((yul) => {
            const astNode = transformer.toSolidityStatement(yul);
            ast.setContextRecursive(astNode);
            return astNode;
        });
        const block = new solc_typed_ast_1.UncheckedBlock(ast.reserveId(), this.yul(node).src, statements);
        ast.replaceNode(node, block);
    }
    visitInlineAssembly(node, ast) {
        this.verify(node, ast);
        this.transform(node, ast);
        return this.visitStatement(node, ast);
    }
}
exports.InlineAssemblyTransformer = InlineAssemblyTransformer;
//# sourceMappingURL=inlineAssemblyTransformer.js.map