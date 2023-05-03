"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IfStatementTempVarPostpender = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
const cairoNodes_1 = require("../ast/cairoNodes");
const nodeTemplates_1 = require("../utils/nodeTemplates");
const controlFlowAnalyser_1 = require("../utils/controlFlowAnalyser");
const assert_1 = __importDefault(require("assert"));
const export_1 = require("../export");
/*
 * This pass does a live variable analysis of the code while simultaneously
 * postpending tempvars of the live variables at the end of each if branch and
 * after each IfStatement in order to prevent against revoked references.
 *
 * A variable is 'live' at a line if there is a reference to the variable after
 * the line in the control flow for which there is no matching declaration.
 *
 * This following:
 *
 ********************
 * // y is not live
 * let y = 0
 *   // y is live
 *   if (x == 0) {
 *   // y is live
 * } else {
 *   // y is not live
 *   let y = 4;
 *   // y is live
 * }
 * g(y) // reference to y
 ********************
 *
 * Becomes:
 *
 ********************
 * // y is not live
 * let y = 0
 * // y is live
 * if (x == 0) {
 *   // y is live
 *   tempvar y = y;
 * } else {
 *   // y is not live
 *   let y = 4;
 *   // y is live
 *   tempvar y = y;
 * }
 * tempvar y = y;
 * g(y) // reference to y
 ********************
 */
class IfStatementTempVarPostpender extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.liveVars = new Set();
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'An', // AnotateImplicit pass creates cairoFunctionDefinitions which this pass use
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitCairoFunctionDefinition(node, ast) {
        this.liveVars = new Set();
        [...node.implicits].forEach((implicit) => this.liveVars.add(implicit));
        // analyse the block
        if (node.vBody !== undefined) {
            this.dispatchVisit(node.vBody, ast);
        }
        // remove the parameters and implicits
        const deadVars = [...node.implicits].filter((implicit) => !this.liveVars.delete(implicit));
        if (deadVars.length > 0) {
            throw new errors_1.TranspileFailedError(`Implicit variable(s) dead in function ${node.name}:\n ${deadVars
                .map((implicit) => `  * ${implicit}`)
                .join('\n')} `);
        }
        this.liveVars = new Set();
    }
    visitIdentifier(node, _ast) {
        if (node.vReferencedDeclaration !== undefined &&
            node.vReferencedDeclaration.getClosestParentByType(cairoNodes_1.CairoFunctionDefinition) !== undefined) {
            this.liveVars.add(node.name);
        }
    }
    visitBlock(node, ast) {
        node.vStatements
            .slice(0)
            .reverse()
            .map((child) => this.dispatchVisit(child, ast));
    }
    visitUncheckedBlock(node, ast) {
        node.vStatements
            .slice(0)
            .reverse()
            .map((child) => this.dispatchVisit(child, ast));
    }
    visitVariableDeclarationStatement(node, ast) {
        node.vDeclarations.forEach((declaration) => this.liveVars.delete(declaration.name));
        if (node.vInitialValue) {
            this.dispatchVisit(node.vInitialValue, ast);
        }
    }
    visitFunctionCall(node, ast) {
        // ignore the function identifier
        for (const arg of node.vArguments) {
            this.dispatchVisit(arg, ast);
        }
    }
    visitIfStatement(node, ast) {
        ensureBothBranchesAreBlocks(node, ast);
        (0, assert_1.default)(node.vTrueBody instanceof solc_typed_ast_1.Block && node.vFalseBody instanceof solc_typed_ast_1.Block);
        const liveVarsBefore = new Set(this.liveVars);
        this.dispatchVisit(node.vTrueBody, ast);
        const liveVarsAfterTrueBody = new Set(this.liveVars);
        this.liveVars = new Set(liveVarsBefore);
        let liveVarsAfterFalseBody = new Set();
        this.dispatchVisit(node.vFalseBody, ast);
        liveVarsAfterFalseBody = new Set(this.liveVars);
        this.liveVars = new Set(liveVarsBefore);
        this.dispatchVisit(node.vCondition, ast);
        this.liveVars = new Set([
            ...this.liveVars,
            ...liveVarsAfterFalseBody,
            ...liveVarsAfterTrueBody,
        ]);
        const trueHasPathWithoutReturn = (0, controlFlowAnalyser_1.hasPathWithoutReturn)(node.vTrueBody);
        if (trueHasPathWithoutReturn) {
            setBlockTempvars(node.vTrueBody, liveVarsBefore, ast);
        }
        const falseHasPathWithoutReturn = (0, controlFlowAnalyser_1.hasPathWithoutReturn)(node.vFalseBody);
        if (falseHasPathWithoutReturn) {
            setBlockTempvars(node.vFalseBody, liveVarsBefore, ast);
        }
        if (falseHasPathWithoutReturn || trueHasPathWithoutReturn) {
            const parent = node.parent;
            const blockWithAfter = (0, nodeTemplates_1.createBlock)([node, ...[...liveVarsBefore].map((v) => (0, nodeTemplates_1.createCairoTempVar)(v, ast))], ast);
            ast.replaceNode(node, blockWithAfter, parent);
        }
    }
}
exports.IfStatementTempVarPostpender = IfStatementTempVarPostpender;
function ensureBothBranchesAreBlocks(node, ast) {
    if (!(0, export_1.isBlock)(node.vTrueBody)) {
        node.vTrueBody = (0, nodeTemplates_1.createBlock)([node.vTrueBody], ast);
        ast.registerChild(node.vTrueBody, node);
    }
    if (node.vFalseBody === undefined) {
        node.vFalseBody = (0, nodeTemplates_1.createBlock)([], ast);
        ast.registerChild(node.vFalseBody, node);
    }
    else if (!(0, export_1.isBlock)(node.vFalseBody)) {
        node.vFalseBody = (0, nodeTemplates_1.createBlock)([node.vFalseBody], ast);
        ast.registerChild(node.vFalseBody, node);
    }
}
function setBlockTempvars(node, liveVars, ast) {
    for (const liveVar of liveVars) {
        const child = (0, nodeTemplates_1.createCairoTempVar)(liveVar, ast);
        node.appendChild(child);
        ast.registerChild(child, node);
    }
}
//# sourceMappingURL=ifStatementTempVarPostpender.js.map