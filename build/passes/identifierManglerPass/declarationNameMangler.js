"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeclarationNameMangler = exports.checkSourceTerms = exports.reservedTerms = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const astPrinter_1 = require("../../utils/astPrinter");
const errors_1 = require("../../utils/errors");
const nameModifiers_1 = require("../../utils/nameModifiers");
const utils_1 = require("../../utils/utils");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
// Terms grabbed from here
// https://github.com/starkware-libs/cairo-lang/blob/master/src/starkware/cairo/lang/compiler/cairo.ebnf
exports.reservedTerms = new Set([
    'ret',
    'return',
    'using',
    'jmp',
    'alloc_locals',
    'rel',
    'func',
    'nondet',
    'felt',
    'codeoffset',
    'Uint256',
    'cast',
    'ap',
    'fp',
    'dw',
    '%lang',
    '%builtins',
    'with_attr',
    'static_assert',
    'assert',
    'new',
    'call',
    'abs',
    'as',
    'from',
    'local',
    'let',
    'tempvar',
    'const',
    'struct',
    'namespace',
]);
const unsupportedCharacters = ['$'];
function checkSourceTerms(term, node) {
    if (exports.reservedTerms.has(term)) {
        throw new errors_1.WillNotSupportError(`${(0, astPrinter_1.printNode)(node)} contains ${term} which is a cairo keyword`);
    }
    // Creating the regular expression that match unsupportedCharacters
    const regexStr = unsupportedCharacters.reduce((prevVal, val, i) => (i === 0 ? '\\' + val : (prevVal += '|\\' + val)), '');
    // Looking for possible matches
    const regex = RegExp(regexStr, 'g');
    let match;
    let unsupportedCharactersFound = '';
    while ((match = regex.exec(term)) !== null) {
        // Saving all chars founded
        unsupportedCharactersFound += match[0];
    }
    if (unsupportedCharactersFound) {
        throw new errors_1.WillNotSupportError(`${(0, astPrinter_1.printNode)(node)} ${term} contains unsupported character(s) "${unsupportedCharactersFound}"`);
    }
}
exports.checkSourceTerms = checkSourceTerms;
class DeclarationNameMangler extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.nameCounter = 0;
    }
    visitSourceUnit(node, ast) {
        node.vStructs.forEach((s) => this.mangleStructDefinition(s));
        node.vFunctions.forEach((n) => this.mangleFunctionDefinition(n, ast));
        node.vContracts.forEach((n) => this.mangleContractDefinition(n, ast));
        this.commonVisit(node, ast);
    }
    visitVariableDeclaration(node, ast) {
        // state variables should have already been mangled at this point
        // by mangleContractDefinition when visiting SourceUnit nodes
        if (!node.stateVariable)
            this.mangleVariableDeclaration(node);
        this.commonVisit(node, ast);
    }
    visitForStatement(node, ast) {
        // The declarations in for loops are mangled because the loop functionalisation extracts
        // declarations to the current scope instead of creating a new one.
        if (node.vInitializationExpression instanceof solc_typed_ast_1.VariableDeclarationStatement) {
            node.vInitializationExpression.vDeclarations.forEach((declaration) => {
                declaration.name = this.createNewVariableName(declaration.name);
            });
        }
        this.commonVisit(node, ast);
    }
    // This strategy should allow checked demangling post transpilation for a more readable result
    createNewFunctionName(fd, ast) {
        return !(0, utils_1.isNameless)(fd) ? `${fd.name}_${(0, nodeTypeProcessing_1.safeCanonicalHash)(fd, ast)}` : fd.name;
    }
    createNewVariableName(existingName) {
        return `${nameModifiers_1.MANGLED_WARP}${this.nameCounter++}${existingName !== '' ? `_${existingName}` : ''}`;
    }
    checkCollision(node) {
        const parentContract = node.getClosestParentByType(solc_typed_ast_1.ContractDefinition);
        const parentScope = node.vScope;
        return (parentContract?.name === node.name ||
            parentScope
                .getChildrenByType(solc_typed_ast_1.Identifier, true)
                .some((identifier) => identifier.name === node.name));
    }
    mangleVariableDeclaration(node) {
        if (exports.reservedTerms.has(node.name) || node.name === '' || this.checkCollision(node))
            node.name = this.createNewVariableName(node.name);
        checkSourceTerms(node.name, node);
    }
    mangleStructDefinition(node) {
        checkSourceTerms(node.name, node);
        node.vMembers.forEach((m) => this.mangleVariableDeclaration(m));
    }
    mangleFunctionDefinition(node, ast) {
        node.name = this.createNewFunctionName(node, ast);
    }
    mangleContractDefinition(node, ast) {
        checkSourceTerms(node.name, node);
        node.vStructs.forEach((s) => this.mangleStructDefinition(s));
        node.vFunctions.forEach((n) => this.mangleFunctionDefinition(n, ast));
        node.vStateVariables.forEach((v) => this.mangleVariableDeclaration(v));
    }
}
exports.DeclarationNameMangler = DeclarationNameMangler;
//# sourceMappingURL=declarationNameMangler.js.map