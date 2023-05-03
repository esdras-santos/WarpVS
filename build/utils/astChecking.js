"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSane = exports.checkSane = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const index_1 = require("solc-typed-ast/dist/misc/index");
const cairoNodes_1 = require("../ast/cairoNodes");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
const utils_1 = require("./utils");
// This is the solc-typed-ast AST checking code, with additions for CairoAssert and CairoContract
/**
 * Helper function to check if the node/nodes `arg` is in the `ASTContext` `ctx`.
 */
function inCtx(arg, ctx) {
    if (arg instanceof solc_typed_ast_1.ASTNode) {
        return ctx.contains(arg);
    }
    for (const node of arg) {
        if (!inCtx(node, ctx)) {
            return false;
        }
    }
    return true;
}
/**
 * Check that the property `prop` of an `ASTNode` `node` is either an `ASTNode`
 * in the expected `ASTContext` `ctx` or an array `ASTNode[]` all of which are in
 * the expected `ASTContext`
 */
function checkVFieldCtx(node, prop, ctx) {
    const val = node[prop];
    if (val instanceof solc_typed_ast_1.ASTNode) {
        if (!inCtx(val, ctx)) {
            throw new Error(`Node ${(0, index_1.pp)(node)} property ${String(prop)} ${(0, index_1.pp)(val)} not in expected context ${(0, index_1.pp)(ctx)}. Instead in ${(0, index_1.pp)(val.context)}`);
        }
    }
    else if (val instanceof Array) {
        for (let idx = 0; idx < val.length; idx++) {
            const el = val[idx];
            if (!(el instanceof solc_typed_ast_1.ASTNode)) {
                throw new Error(`Expected property ${String(prop)}[${idx}] of ${(0, index_1.pp)(node)} to be an ASTNode not ${el}`);
            }
            if (!inCtx(val, ctx)) {
                throw new Error(`Node ${(0, index_1.pp)(node)} property ${String(prop)}[${idx}] ${(0, index_1.pp)(el)} not in expected context ${(0, index_1.pp)(ctx)}. Instead in ${(0, index_1.pp)(el.context)}`);
            }
        }
    }
    else {
        throw new Error(`Expected property ${String(prop)} of ${(0, index_1.pp)(node)} to be an ASTNode, not ${val}`);
    }
}
/**
 * Helper to check that:
 *
 * 1) the field `field` of `node` is either a number or array of numbers
 * 2) the field `vField` of `node` is either an `ASTNode` or an array of ASTNodes
 * 3) if field is a number then `vField` is an `ASTNode` and `field == vField.id`
 * 4) if field is an array of numbers then `vField` is an `ASTNode[]` and
 *      `node.field.length === node.vField.length` and `node.field[i] ===
 *      node.vField[i].id` forall i in `[0, ... node.field.length)`
 *
 */
function checkFieldAndVFieldMatch(node, field, vField) {
    const val1 = node[field];
    const val2 = node[vField];
    if (typeof val1 === 'number') {
        if (!(val2 instanceof solc_typed_ast_1.ASTNode)) {
            throw new Error(`Expected property ${String(vField)} of ${(0, index_1.pp)(node)} to be an ASTNode when ${String(field)} is a number, not ${val2}`);
        }
        if (val1 !== val2.id) {
            throw new errors_1.InsaneASTError(`Node ${(0, index_1.pp)(node)} property ${String(field)} ${val1} differs from ${String(vField)}.id ${(0, index_1.pp)(val2)}`);
        }
    }
    else if (val1 instanceof Array) {
        if (!(val2 instanceof Array)) {
            throw new Error(`Expected property ${String(vField)} of ${(0, index_1.pp)(node)} to be an array when ${String(vField)} is an array, not ${val2}`);
        }
        if (val1.length !== val2.length) {
            throw new errors_1.InsaneASTError(`Node ${(0, index_1.pp)(node)} array properties ${String(field)} and ${String(vField)} have different lengths ${val1.length} != ${val2.length}`);
        }
        for (let idx = 0; idx < val1.length; idx++) {
            const el1 = val1[idx];
            const el2 = val2[idx];
            if (typeof el1 !== 'number') {
                throw new Error(`Expected property ${String(field)}[${idx}] of ${(0, index_1.pp)(node)} to be a number not ${el1}`);
            }
            if (!(el2 instanceof solc_typed_ast_1.ASTNode)) {
                throw new Error(`Expected property ${String(vField)}[${idx}] of ${(0, index_1.pp)(node)} to be a number not ${el2}`);
            }
            if (el1 !== el2.id) {
                throw new errors_1.InsaneASTError(`Node ${(0, index_1.pp)(node)} property ${String(field)}[${idx}] ${el1} differs from ${String(vField)}[${idx}].id ${(0, index_1.pp)(el2)}`);
            }
        }
    }
    else {
        throw new Error(`Expected property ${String(field)} of ${(0, index_1.pp)(node)} to be a number or  array of numbers not ${val1}`);
    }
}
/**
 * Helper to check that:
 *
 * 1. All ASTNodes that appear in each of the `fields` of `node` is a direct child of `node`
 * 2. All the direct children of `node` are mentioned in some of the `fields`.
 */
function checkDirectChildren(node, ...fields) {
    const directChildren = new Set(node.children);
    const computedChildren = new Set();
    for (const field of fields) {
        const val = node[field];
        if (val === undefined) {
            continue;
        }
        if (val instanceof solc_typed_ast_1.ASTNode) {
            if (!directChildren.has(val)) {
                throw new errors_1.InsaneASTError(`Field ${String(field)} of node ${(0, index_1.pp)(node)} is not a direct child: ${(0, index_1.pp)(val)} child of ${(0, index_1.pp)(val.parent)}`);
            }
            computedChildren.add(val);
        }
        else if (val instanceof Array) {
            for (let i = 0; i < val.length; i++) {
                const el = val[i];
                if (el === null) {
                    continue;
                }
                if (!(el instanceof solc_typed_ast_1.ASTNode)) {
                    throw new Error(`Field ${String(field)} of ${(0, index_1.pp)(node)} is expected to be ASTNode, array or map with ASTNodes - instead array containing ${el}`);
                }
                if (!directChildren.has(el)) {
                    throw new errors_1.InsaneASTError(`Field ${String(field)}[${i}] of node ${(0, index_1.pp)(node)} is not a direct child: ${(0, index_1.pp)(el)} child of ${(0, index_1.pp)(el.parent)}`);
                }
                computedChildren.add(el);
            }
        }
        else if (val instanceof Map) {
            for (const [k, v] of val.entries()) {
                if (v === null) {
                    continue;
                }
                if (!(v instanceof solc_typed_ast_1.ASTNode)) {
                    throw new Error(`Field ${String(field)} of ${(0, index_1.pp)(node)} is expected to be ASTNode, array or map with ASTNodes - instead map containing ${v}`);
                }
                if (!directChildren.has(v)) {
                    throw new errors_1.InsaneASTError(`Field ${String(field)}[${k}] of node ${(0, index_1.pp)(node)} is not a direct child: ${(0, index_1.pp)(v)} child of ${(0, index_1.pp)(v.parent)}`);
                }
                computedChildren.add(v);
            }
        }
        else {
            throw new Error(`Field ${String(field)} of ${(0, index_1.pp)(node)} is neither an ASTNode nor an array of ASTNode or nulls: ${val}`);
        }
    }
    if (computedChildren.size < directChildren.size) {
        let missingChild;
        for (const child of directChildren) {
            if (computedChildren.has(child)) {
                continue;
            }
            missingChild = child;
            break;
        }
        throw new errors_1.InsaneASTError(`Fields ${fields.join(', ')} don't completely cover the direct children: ${(0, index_1.pp)(missingChild)} is missing`);
    }
}
/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *
 *  - all reachable nodes belong to the same context, have their parent/sibling set correctly,
 *  - all number id properties of nodes point to a node in the same context
 *  - when a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number property corresponds to the id of the `v` prefixed property.
 *  - most 'v' properties point to direct children of a node
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 *
 * @param unit - source unit to check
 * @param ctx - `ASTContext`s for each of the groups of units
 */
function checkSane(unit, ctx) {
    for (const node of unit.getChildren(true)) {
        if (!inCtx(node, ctx)) {
            throw new errors_1.InsaneASTError(`Child ${(0, index_1.pp)(node)} in different context: ${ctx.id} from expected ${ctx.id}`);
        }
        const immediateChildren = node.children;
        for (const child of immediateChildren) {
            if (child.parent !== node) {
                throw new errors_1.InsaneASTError(`Child ${(0, index_1.pp)(child)} has wrong parent: expected ${(0, index_1.pp)(node)} got ${(0, index_1.pp)(child.parent)}`);
            }
        }
        if (node instanceof solc_typed_ast_1.PragmaDirective ||
            node instanceof solc_typed_ast_1.StructuredDocumentation ||
            node instanceof solc_typed_ast_1.EnumValue ||
            node instanceof solc_typed_ast_1.Break ||
            node instanceof solc_typed_ast_1.Continue ||
            node instanceof solc_typed_ast_1.InlineAssembly ||
            node instanceof solc_typed_ast_1.PlaceholderStatement ||
            node instanceof solc_typed_ast_1.Throw ||
            node instanceof solc_typed_ast_1.ElementaryTypeName ||
            node instanceof solc_typed_ast_1.Literal) {
            /**
             * These nodes do not have any children or references.
             * There is nothing to check, so just skip them.
             */
            continue;
        }
        if (node instanceof solc_typed_ast_1.SourceUnit) {
            for (const [name, symId] of node.exportedSymbols) {
                const symNode = ctx.locate(symId);
                if (symNode === undefined) {
                    throw new errors_1.InsaneASTError(`Exported symbol ${name} ${symId} missing from context ${ctx.id}`);
                }
                if (symNode !== node.vExportedSymbols.get(name)) {
                    throw new errors_1.InsaneASTError(`Exported symbol ${name} for id ${symId} (${(0, index_1.pp)(symNode)}) doesn't match vExportedSymbols entry: ${(0, index_1.pp)(node.vExportedSymbols.get(name))}`);
                }
            }
            checkDirectChildren(node, 'vPragmaDirectives', 'vImportDirectives', 'vContracts', 'vEnums', 'vStructs', 'vFunctions', 'vVariables', 'vErrors', 'vUserDefinedValueTypes', 'vUsingForDirectives');
        }
        else if (node instanceof solc_typed_ast_1.ImportDirective) {
            /**
             * Unfortunately due to compiler bugs in older compilers, when child.symbolAliases[i].foreign is a number
             * its invalid. When its an Identifier, only its name is valid.
             */
            if (node.vSymbolAliases.length !== 0 &&
                node.vSymbolAliases.length !== node.symbolAliases.length) {
                throw new errors_1.InsaneASTError(`symbolAliases.length (${node.symbolAliases.length}) and vSymbolAliases.length ${node.vSymbolAliases.length} mismatch for import ${(0, index_1.pp)(node)}`);
            }
            for (let i = 0; i < node.vSymbolAliases.length; i++) {
                const def = node.vSymbolAliases[i][0];
                if (!inCtx(def, ctx)) {
                    throw new errors_1.InsaneASTError(`Imported symbol ${(0, index_1.pp)(def)} from import ${(0, index_1.pp)(node)} not in expected context ${(0, index_1.pp)(ctx)}`);
                }
            }
            checkFieldAndVFieldMatch(node, 'scope', 'vScope');
            checkVFieldCtx(node, 'vScope', ctx);
            checkFieldAndVFieldMatch(node, 'sourceUnit', 'vSourceUnit');
            checkVFieldCtx(node, 'vSourceUnit', ctx);
        }
        else if (node instanceof solc_typed_ast_1.InheritanceSpecifier) {
            checkDirectChildren(node, 'vBaseType', 'vArguments');
        }
        else if (node instanceof solc_typed_ast_1.ModifierInvocation) {
            checkVFieldCtx(node, 'vModifier', ctx);
            checkDirectChildren(node, 'vModifierName', 'vArguments');
        }
        else if (node instanceof solc_typed_ast_1.OverrideSpecifier) {
            checkDirectChildren(node, 'vOverrides');
        }
        else if (node instanceof solc_typed_ast_1.ParameterList) {
            checkVFieldCtx(node, 'vParameters', ctx);
            checkDirectChildren(node, 'vParameters');
        }
        else if (node instanceof solc_typed_ast_1.UsingForDirective) {
            checkDirectChildren(node, 'vLibraryName', 'vFunctionList', 'vTypeName');
        }
        else if (node instanceof solc_typed_ast_1.ContractDefinition) {
            checkFieldAndVFieldMatch(node, 'scope', 'vScope');
            checkVFieldCtx(node, 'vScope', ctx);
            if (node.vScope !== node.parent) {
                throw new errors_1.InsaneASTError(`Contract ${(0, index_1.pp)(node)} vScope ${(0, index_1.pp)(node.vScope)} and parent ${(0, index_1.pp)(node.parent)} differ`);
            }
            checkFieldAndVFieldMatch(node, 'linearizedBaseContracts', 'vLinearizedBaseContracts');
            checkVFieldCtx(node, 'vLinearizedBaseContracts', ctx);
            checkFieldAndVFieldMatch(node, 'usedErrors', 'vUsedErrors');
            checkVFieldCtx(node, 'vUsedErrors', ctx);
            const fields = [
                'documentation',
                'vInheritanceSpecifiers',
                'vStateVariables',
                'vModifiers',
                'vErrors',
                'vEvents',
                'vFunctions',
                'vUsingForDirectives',
                'vStructs',
                'vEnums',
                'vUserDefinedValueTypes',
                'vConstructor',
            ];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.EnumDefinition) {
            checkVFieldCtx(node, 'vScope', ctx);
            checkDirectChildren(node, 'vMembers');
        }
        else if (node instanceof solc_typed_ast_1.ErrorDefinition) {
            checkVFieldCtx(node, 'vScope', ctx);
            const fields = ['vParameters'];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.EventDefinition) {
            checkVFieldCtx(node, 'vScope', ctx);
            const fields = ['vParameters'];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.FunctionDefinition) {
            checkFieldAndVFieldMatch(node, 'scope', 'vScope');
            checkVFieldCtx(node, 'vScope', ctx);
            const fields = [
                'vParameters',
                'vOverrideSpecifier',
                'vModifiers',
                'vReturnParameters',
                'vBody',
            ];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.ModifierDefinition) {
            checkVFieldCtx(node, 'vScope', ctx);
            const fields = [
                'vParameters',
                'vOverrideSpecifier',
                'vBody',
            ];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.StructDefinition) {
            checkFieldAndVFieldMatch(node, 'scope', 'vScope');
            checkVFieldCtx(node, 'vScope', ctx);
            checkDirectChildren(node, 'vMembers');
        }
        else if (node instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition) {
            checkVFieldCtx(node, 'vScope', ctx);
            checkVFieldCtx(node, 'underlyingType', ctx);
            checkDirectChildren(node, 'underlyingType');
        }
        else if (node instanceof solc_typed_ast_1.VariableDeclaration) {
            checkFieldAndVFieldMatch(node, 'scope', 'vScope');
            checkVFieldCtx(node, 'vScope', ctx);
            const fields = ['vType', 'vOverrideSpecifier', 'vValue'];
            if (node.documentation instanceof solc_typed_ast_1.StructuredDocumentation) {
                checkVFieldCtx(node, 'documentation', ctx);
                fields.push('documentation');
            }
            checkDirectChildren(node, ...fields);
        }
        else if (node instanceof solc_typed_ast_1.Block || node instanceof solc_typed_ast_1.UncheckedBlock) {
            checkDirectChildren(node, 'vStatements');
        }
        else if (node instanceof solc_typed_ast_1.DoWhileStatement) {
            checkDirectChildren(node, 'vCondition', 'vBody');
        }
        else if (node instanceof solc_typed_ast_1.EmitStatement) {
            checkDirectChildren(node, 'vEventCall');
        }
        else if (node instanceof solc_typed_ast_1.RevertStatement) {
            checkDirectChildren(node, 'errorCall');
        }
        else if (node instanceof solc_typed_ast_1.ExpressionStatement) {
            checkDirectChildren(node, 'vExpression');
        }
        else if (node instanceof solc_typed_ast_1.ForStatement) {
            checkDirectChildren(node, 'vInitializationExpression', 'vLoopExpression', 'vCondition', 'vBody');
        }
        else if (node instanceof solc_typed_ast_1.IfStatement) {
            checkVFieldCtx(node, 'vCondition', ctx);
            checkVFieldCtx(node, 'vTrueBody', ctx);
            if (node.vFalseBody !== undefined) {
                checkVFieldCtx(node, 'vFalseBody', ctx);
            }
            checkDirectChildren(node, 'vCondition', 'vTrueBody', 'vFalseBody');
        }
        else if (node instanceof solc_typed_ast_1.Return) {
            // return functionReturnParameters member is undefined for returns in modifiers
            if (node.functionReturnParameters !== undefined) {
                checkFieldAndVFieldMatch(node, 'functionReturnParameters', 'vFunctionReturnParameters');
                checkVFieldCtx(node, 'vFunctionReturnParameters', ctx);
            }
            checkDirectChildren(node, 'vExpression');
        }
        else if (node instanceof solc_typed_ast_1.TryCatchClause) {
            checkDirectChildren(node, 'vParameters', 'vBlock');
        }
        else if (node instanceof solc_typed_ast_1.TryStatement) {
            checkDirectChildren(node, 'vExternalCall', 'vClauses');
        }
        else if (node instanceof solc_typed_ast_1.VariableDeclarationStatement) {
            checkDirectChildren(node, 'vDeclarations', 'vInitialValue');
        }
        else if (node instanceof solc_typed_ast_1.WhileStatement) {
            checkDirectChildren(node, 'vCondition', 'vBody');
        }
        else if (node instanceof solc_typed_ast_1.ArrayTypeName) {
            checkDirectChildren(node, 'vBaseType', 'vLength');
        }
        else if (node instanceof solc_typed_ast_1.FunctionTypeName) {
            checkDirectChildren(node, 'vParameterTypes', 'vReturnParameterTypes');
        }
        else if (node instanceof solc_typed_ast_1.Mapping) {
            checkDirectChildren(node, 'vKeyType', 'vValueType');
        }
        else if (node instanceof solc_typed_ast_1.UserDefinedTypeName) {
            checkFieldAndVFieldMatch(node, 'referencedDeclaration', 'vReferencedDeclaration');
            checkVFieldCtx(node, 'vReferencedDeclaration', ctx);
            checkDirectChildren(node, 'path');
        }
        else if (node instanceof solc_typed_ast_1.Assignment) {
            checkDirectChildren(node, 'vLeftHandSide', 'vRightHandSide');
        }
        else if (node instanceof solc_typed_ast_1.BinaryOperation) {
            checkDirectChildren(node, 'vLeftExpression', 'vRightExpression');
        }
        else if (node instanceof solc_typed_ast_1.Conditional) {
            checkDirectChildren(node, 'vCondition', 'vTrueExpression', 'vFalseExpression');
        }
        else if (node instanceof solc_typed_ast_1.ElementaryTypeNameExpression) {
            if (!(typeof node.typeName === 'string')) {
                checkDirectChildren(node, 'typeName');
            }
        }
        else if (node instanceof solc_typed_ast_1.FunctionCall) {
            checkDirectChildren(node, 'vExpression', 'vArguments');
        }
        else if (node instanceof solc_typed_ast_1.FunctionCallOptions) {
            checkDirectChildren(node, 'vExpression', 'vOptionsMap');
        }
        else if (node instanceof solc_typed_ast_1.Identifier || node instanceof solc_typed_ast_1.IdentifierPath) {
            if (node.referencedDeclaration !== null && node.vReferencedDeclaration !== undefined) {
                checkFieldAndVFieldMatch(node, 'referencedDeclaration', 'vReferencedDeclaration');
                checkVFieldCtx(node, 'vReferencedDeclaration', ctx);
            }
        }
        else if (node instanceof solc_typed_ast_1.IndexAccess) {
            checkDirectChildren(node, 'vBaseExpression', 'vIndexExpression');
        }
        else if (node instanceof solc_typed_ast_1.IndexRangeAccess) {
            checkDirectChildren(node, 'vBaseExpression', 'vStartExpression', 'vEndExpression');
        }
        else if (node instanceof solc_typed_ast_1.MemberAccess) {
            if (node.referencedDeclaration !== null && node.vReferencedDeclaration !== undefined) {
                checkFieldAndVFieldMatch(node, 'referencedDeclaration', 'vReferencedDeclaration');
                checkVFieldCtx(node, 'vReferencedDeclaration', ctx);
            }
            checkDirectChildren(node, 'vExpression');
        }
        else if (node instanceof solc_typed_ast_1.NewExpression) {
            checkDirectChildren(node, 'vTypeName');
        }
        else if (node instanceof solc_typed_ast_1.TupleExpression) {
            checkDirectChildren(node, 'vOriginalComponents', 'vComponents');
        }
        else if (node instanceof solc_typed_ast_1.UnaryOperation) {
            checkVFieldCtx(node, 'vSubExpression', ctx);
            checkDirectChildren(node, 'vSubExpression');
        }
        else if (node instanceof cairoNodes_1.CairoAssert) {
            checkDirectChildren(node, 'vExpression');
        }
        else if (node instanceof cairoNodes_1.CairoTempVarStatement) {
            // Not being checked because this node does not get affected by any
            // other ast pass
        }
        else {
            throw new Error(`Unknown ASTNode type ${node.constructor.name}`);
        }
    }
}
exports.checkSane = checkSane;
function checkContextsDefined(node) {
    const context = node.context;
    if (context === undefined) {
        throw new errors_1.InsaneASTError(`${node.type} ${node.id} has no context`);
    }
    node.children.forEach((child) => checkContextsDefined(child));
}
function checkIdNonNegative(node) {
    if (node.id < 0)
        throw new errors_1.InsaneASTError(`${node.type} ${node.id} has invalid id`);
    node.children.forEach((child) => checkIdNonNegative(child));
}
function checkOnlyConstructorsMarkedAsConstructors(nodes) {
    nodes.forEach((func) => {
        if ((func.kind === solc_typed_ast_1.FunctionKind.Constructor) !== func.isConstructor)
            throw new errors_1.InsaneASTError(`${(0, astPrinter_1.printNode)(func)} ${func.name} is incorrectly marked as ${func.isConstructor ? '' : 'not '} a constructor`);
    });
}
// Check that functions of kind: constructor, receive and fallback are nameless
function checkEmptyNamesForNamelessFunctions(nodes) {
    nodes.forEach((func) => {
        if (func.name === '' && !(0, utils_1.isNameless)(func)) {
            throw new errors_1.InsaneASTError(`${(0, astPrinter_1.printNode)(func)} has an empty name but it's kind: ${func.kind} is different than constructor, fallback or receive`);
        }
        if (func.name !== '' && (0, utils_1.isNameless)(func)) {
            throw new errors_1.InsaneASTError(`${(0, astPrinter_1.printNode)(func)} of kind ${func.kind} has a non-empty name: ${func.name}`);
        }
    });
}
/**
 * Check that a single SourceUnit has a sane structure. This checks that:
 *  - All reachable nodes belong to the same context, have their parent/sibling set correctly.
 *  - All number id properties of nodes point to a node in the same context.
 *  - When a number property (e.g. `scope`) has a corresponding `v` prefixed property (e.g. `vScope`)
 *    check that the number property corresponds to the id of the `v` prefixed property.
 *  - Most 'v' properties point to direct children of a node.
 *
 * NOTE: While this code can be slightly slow, its meant to be used mostly in testing so its
 * not performance critical.
 */
function isSane(ast, devMode) {
    IdChecker.map(ast);
    if (devMode) {
        NodeTypeResolutionChecker.map(ast);
        ParameterScopeChecker.map(ast);
        return ast.roots.every((root) => {
            try {
                checkSane(root, ast.context);
                checkContextsDefined(root);
                checkIdNonNegative(root);
                const functionDefinitions = root.getChildrenByType(solc_typed_ast_1.FunctionDefinition);
                checkOnlyConstructorsMarkedAsConstructors(functionDefinitions);
                checkEmptyNamesForNamelessFunctions(functionDefinitions);
            }
            catch (e) {
                if (e instanceof errors_1.InsaneASTError) {
                    console.error(e);
                    return false;
                }
                throw e;
            }
            return true;
        });
    }
    return true;
}
exports.isSane = isSane;
class NodeTypeResolutionChecker extends mapper_1.ASTMapper {
    visitSourceUnit(node, ast) {
        node
            .getChildren()
            .filter((child) => child instanceof solc_typed_ast_1.Expression || child instanceof solc_typed_ast_1.VariableDeclaration)
            .filter((child) => child.parent !== undefined && !(child.parent instanceof solc_typed_ast_1.ImportDirective))
            .forEach((child) => (0, nodeTypeProcessing_1.safeGetNodeType)(child, ast.inference));
    }
}
class ParameterScopeChecker extends mapper_1.ASTMapper {
    visitFunctionDefinition(node, _ast) {
        [...node.vParameters.vParameters, ...node.vReturnParameters.vParameters].forEach((decl) => {
            if (decl.scope !== node.id) {
                throw new errors_1.InsaneASTError(`${(0, astPrinter_1.printNode)(decl)} in ${(0, astPrinter_1.printNode)(node)} has scope ${decl.scope}, expected ${node.id}`);
            }
        });
    }
}
/* The pass asserts that all id based references refer
   to nodes that are children of the roots of the AST.
*/
class IdChecker extends mapper_1.ASTMapper {
    visitContractDefinition(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.scope) || !ast.context.map.has(node.scope), `${(0, astPrinter_1.printNode)(node)} has invalid scope`);
    }
    visitFunctionDefinition(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.scope) || !ast.context.map.has(node.scope), `${(0, astPrinter_1.printNode)(node)} has invalid scope`);
    }
    visitImportDirective(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.scope) || !ast.context.map.has(node.scope), `${(0, astPrinter_1.printNode)(node)} has invalid scope`);
    }
    visitStructDefinition(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.scope) || !ast.context.map.has(node.scope), `${(0, astPrinter_1.printNode)(node)} has invalid scope`);
    }
    visitVariableDeclaration(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.scope) || !ast.context.map.has(node.scope), `${(0, astPrinter_1.printNode)(node)} has invalid scope`);
    }
    visitIdentifier(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.referencedDeclaration) ||
            !ast.context.map.has(node.referencedDeclaration), `${(0, astPrinter_1.printNode)(node)} has invalid referenced declaration`);
    }
    visitIdentifierPath(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.referencedDeclaration) ||
            !ast.context.map.has(node.referencedDeclaration), `${(0, astPrinter_1.printNode)(node)} has invalid referenced declaration`);
    }
    visitMemberAccess(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.referencedDeclaration) ||
            !ast.context.map.has(node.referencedDeclaration), `${(0, astPrinter_1.printNode)(node)} has invalid referenced declaration`);
    }
    visitUserDefinedTypeName(node, ast) {
        (0, assert_1.default)(IdChecker.Ids.has(node.referencedDeclaration) ||
            !ast.context.map.has(node.referencedDeclaration), `${(0, astPrinter_1.printNode)(node)} has invalid referenced declaration`);
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            root.getChildren(true).forEach((node) => {
                this.Ids.add(node.id);
            });
        });
        ast.roots.forEach((root) => {
            root.getChildren(true).forEach((node) => {
                const pass = new this();
                if (node instanceof solc_typed_ast_1.ContractDefinition) {
                    pass.visitContractDefinition(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.FunctionDefinition) {
                    pass.visitFunctionDefinition(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.ImportDirective) {
                    pass.visitImportDirective(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.StructDefinition) {
                    pass.visitStructDefinition(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.VariableDeclaration) {
                    pass.visitVariableDeclaration(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.Identifier) {
                    pass.visitIdentifier(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.IdentifierPath) {
                    pass.visitIdentifierPath(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.MemberAccess) {
                    pass.visitMemberAccess(node, ast);
                }
                else if (node instanceof solc_typed_ast_1.UserDefinedTypeName) {
                    pass.visitUserDefinedTypeName(node, ast);
                }
            });
        });
        return ast;
    }
}
IdChecker.Ids = new Set();
//# sourceMappingURL=astChecking.js.map