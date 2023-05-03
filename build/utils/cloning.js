"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneDocumentation = exports.cloneASTNode = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const nodeTemplates_1 = require("./nodeTemplates");
const typeConstructs_1 = require("./typeConstructs");
function cloneASTNode(node, ast) {
    const idRemappings = new Map();
    const clonedNode = cloneASTNodeImpl(node, ast, idRemappings);
    clonedNode.walk((node) => {
        if (node instanceof solc_typed_ast_1.Identifier || node instanceof solc_typed_ast_1.UserDefinedTypeName) {
            node.referencedDeclaration =
                idRemappings.get(node.referencedDeclaration) ?? node.referencedDeclaration;
        }
        else if (node instanceof solc_typed_ast_1.Return) {
            node.functionReturnParameters =
                idRemappings.get(node.functionReturnParameters) ?? node.functionReturnParameters;
        }
        else if (node instanceof solc_typed_ast_1.VariableDeclarationStatement) {
            node.assignments = node.assignments.map((assignment) => {
                if (assignment === null)
                    return null;
                return idRemappings.get(assignment) ?? assignment;
            });
        }
        else if (node instanceof solc_typed_ast_1.FunctionDefinition ||
            node instanceof solc_typed_ast_1.VariableDeclaration ||
            node instanceof solc_typed_ast_1.ImportDirective) {
            node.scope = idRemappings.get(node.scope) ?? node.scope;
        }
    });
    return clonedNode;
}
exports.cloneASTNode = cloneASTNode;
function cloneASTNodeImpl(node, ast, remappedIds) {
    let newNode = null;
    // Expressions---------------------------------------------------------------
    if (node instanceof solc_typed_ast_1.Assignment) {
        newNode = new solc_typed_ast_1.Assignment(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.operator, cloneASTNodeImpl(node.vLeftHandSide, ast, remappedIds), cloneASTNodeImpl(node.vRightHandSide, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.BinaryOperation) {
        newNode = new solc_typed_ast_1.BinaryOperation(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.operator, cloneASTNodeImpl(node.vLeftExpression, ast, remappedIds), cloneASTNodeImpl(node.vRightExpression, ast, remappedIds), node.raw);
    }
    else if (node instanceof cairoNodes_1.CairoAssert) {
        newNode = new cairoNodes_1.CairoAssert(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vExpression, ast, remappedIds), node.assertMessage, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ElementaryTypeNameExpression) {
        newNode = new solc_typed_ast_1.ElementaryTypeNameExpression(replaceId(node.id, ast, remappedIds), node.src, node.typeString, typeof node.typeName === 'string'
            ? node.typeName
            : cloneASTNodeImpl(node.typeName, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.FunctionCall) {
        newNode = new solc_typed_ast_1.FunctionCall(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.kind, cloneASTNodeImpl(node.vExpression, ast, remappedIds), node.vArguments.map((arg) => cloneASTNodeImpl(arg, ast, remappedIds)), node.fieldNames, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.FunctionCallOptions) {
        const newOptionMap = new Map();
        [...node.vOptionsMap.entries()].forEach(([key, value]) => newOptionMap.set(key, cloneASTNodeImpl(value, ast, remappedIds)));
        newNode = new solc_typed_ast_1.FunctionCallOptions(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vExpression, ast, remappedIds), newOptionMap, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.IndexAccess) {
        newNode = new solc_typed_ast_1.IndexAccess(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vBaseExpression, ast, remappedIds), node.vIndexExpression && cloneASTNodeImpl(node.vIndexExpression, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.Identifier) {
        newNode = new solc_typed_ast_1.Identifier(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.name, node.referencedDeclaration, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.Literal) {
        newNode = new solc_typed_ast_1.Literal(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.kind, node.hexValue, node.value, node.subdenomination, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.MemberAccess) {
        newNode = new solc_typed_ast_1.MemberAccess(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vExpression, ast, remappedIds), node.memberName, node.referencedDeclaration, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.NewExpression) {
        newNode = new solc_typed_ast_1.NewExpression(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNode(node.vTypeName, ast), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.TupleExpression) {
        const tupleComponents = node.vOriginalComponents.map((component) => {
            return component !== null ? cloneASTNodeImpl(component, ast, remappedIds) : null;
        });
        newNode = new solc_typed_ast_1.TupleExpression(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.isInlineArray, tupleComponents, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.UnaryOperation) {
        newNode = new solc_typed_ast_1.UnaryOperation(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.prefix, node.operator, cloneASTNodeImpl(node.vSubExpression, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.Conditional) {
        newNode = new solc_typed_ast_1.Conditional(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vCondition, ast, remappedIds), cloneASTNodeImpl(node.vTrueExpression, ast, remappedIds), cloneASTNodeImpl(node.vFalseExpression, ast, remappedIds), node.raw);
        // TypeNames---------------------------------------------------------------
    }
    else if (node instanceof solc_typed_ast_1.ArrayTypeName) {
        newNode = new solc_typed_ast_1.ArrayTypeName(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vBaseType, ast, remappedIds), node.vLength && cloneASTNodeImpl(node.vLength, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ElementaryTypeName) {
        newNode = new solc_typed_ast_1.ElementaryTypeName(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.name, node.stateMutability, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.FunctionTypeName) {
        newNode = new solc_typed_ast_1.FunctionTypeName(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.visibility, node.stateMutability, cloneASTNodeImpl(node.vParameterTypes, ast, remappedIds), cloneASTNodeImpl(node.vReturnParameterTypes, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.Mapping) {
        newNode = new solc_typed_ast_1.Mapping(replaceId(node.id, ast, remappedIds), node.src, node.typeString, cloneASTNodeImpl(node.vKeyType, ast, remappedIds), cloneASTNodeImpl(node.vValueType, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.UserDefinedTypeName) {
        newNode = new solc_typed_ast_1.UserDefinedTypeName(replaceId(node.id, ast, remappedIds), node.src, node.typeString, node.name, node.referencedDeclaration, node.path ? cloneASTNodeImpl(node.path, ast, remappedIds) : undefined, node.raw);
        // Statements--------------------------------------------------------------
    }
    else if (node instanceof solc_typed_ast_1.Block) {
        newNode = new solc_typed_ast_1.Block(replaceId(node.id, ast, remappedIds), node.src, node.vStatements.map((s) => cloneASTNodeImpl(s, ast, remappedIds)), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.Break) {
        newNode = cloneBreak(node, ast, remappedIds);
    }
    else if (node instanceof solc_typed_ast_1.Continue) {
        newNode = cloneContinue(node, ast, remappedIds);
    }
    else if (node instanceof solc_typed_ast_1.ExpressionStatement) {
        newNode = new solc_typed_ast_1.ExpressionStatement(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vExpression, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.EmitStatement) {
        newNode = new solc_typed_ast_1.EmitStatement(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vEventCall, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ForStatement) {
        newNode = new solc_typed_ast_1.ForStatement(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vBody, ast, remappedIds), node.vInitializationExpression &&
            cloneASTNodeImpl(node.vInitializationExpression, ast, remappedIds), node.vCondition && cloneASTNodeImpl(node.vCondition, ast, remappedIds), node.vLoopExpression && cloneASTNodeImpl(node.vLoopExpression, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), //cloneASTNodeImpl()
        node.raw);
    }
    else if (node instanceof solc_typed_ast_1.IfStatement) {
        newNode = new solc_typed_ast_1.IfStatement(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vCondition, ast, remappedIds), cloneASTNodeImpl(node.vTrueBody, ast, remappedIds), node.vFalseBody && cloneASTNodeImpl(node.vFalseBody, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.PlaceholderStatement) {
        newNode = clonePlaceholder(node, ast, remappedIds);
    }
    else if (node instanceof solc_typed_ast_1.Return) {
        newNode = new solc_typed_ast_1.Return(replaceId(node.id, ast, remappedIds), node.src, node.functionReturnParameters, node.vExpression && cloneASTNodeImpl(node.vExpression, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.VariableDeclarationStatement) {
        newNode = new solc_typed_ast_1.VariableDeclarationStatement(replaceId(node.id, ast, remappedIds), node.src, node.assignments, node.vDeclarations.map((decl) => cloneASTNodeImpl(decl, ast, remappedIds)), node.vInitialValue && cloneASTNodeImpl(node.vInitialValue, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.WhileStatement) {
        newNode = new solc_typed_ast_1.WhileStatement(replaceId(node.id, ast, remappedIds), node.src, node.vCondition && cloneASTNodeImpl(node.vCondition, ast, remappedIds), node.vBody && cloneASTNodeImpl(node.vBody, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
    }
    else if (node instanceof solc_typed_ast_1.UncheckedBlock) {
        newNode = new solc_typed_ast_1.UncheckedBlock(replaceId(node.id, ast, remappedIds), node.src, node.vStatements.map((s) => cloneASTNodeImpl(s, ast, remappedIds)), cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
        // Resolvable--------------------------------------------------------------
    }
    else if (node instanceof cairoNodes_1.CairoFunctionDefinition) {
        newNode = new cairoNodes_1.CairoFunctionDefinition(replaceId(node.id, ast, remappedIds), node.src, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, cloneASTNodeImpl(node.vParameters, ast, remappedIds), cloneASTNodeImpl(node.vReturnParameters, ast, remappedIds), node.vModifiers.map((m) => cloneASTNodeImpl(m, ast, remappedIds)), new Set([...node.implicits]), node.functionStubKind, node.acceptsRawDarray, node.acceptsUnpackedStructArray, node.vOverrideSpecifier && cloneASTNodeImpl(node.vOverrideSpecifier, ast, remappedIds), node.vBody && cloneASTNodeImpl(node.vBody, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.nameLocation, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.EventDefinition) {
        newNode = new solc_typed_ast_1.EventDefinition(replaceId(node.id, ast, remappedIds), node.src, node.anonymous, node.name, (0, nodeTemplates_1.createParameterList)(node.vParameters.vParameters.map((o) => cloneASTNodeImpl(o, ast, remappedIds)), ast), cloneDocumentation(node.documentation, ast, remappedIds), node.nameLocation, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.FunctionDefinition) {
        newNode = new solc_typed_ast_1.FunctionDefinition(replaceId(node.id, ast, remappedIds), node.src, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, cloneASTNodeImpl(node.vParameters, ast, remappedIds), cloneASTNodeImpl(node.vReturnParameters, ast, remappedIds), node.vModifiers.map((m) => cloneASTNodeImpl(m, ast, remappedIds)), node.vOverrideSpecifier && cloneASTNodeImpl(node.vOverrideSpecifier, ast, remappedIds), node.vBody && cloneASTNodeImpl(node.vBody, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.nameLocation, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ImportDirective) {
        newNode = new solc_typed_ast_1.ImportDirective(replaceId(node.id, ast, remappedIds), node.src, node.file, node.absolutePath, node.unitAlias, node.symbolAliases.map((alias) => ({
            foreign: typeof alias.foreign === 'number'
                ? alias.foreign
                : cloneASTNodeImpl(alias.foreign, ast, remappedIds),
            local: alias.local,
        })), node.scope, node.sourceUnit, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ModifierDefinition) {
        newNode = new solc_typed_ast_1.ModifierDefinition(replaceId(node.id, ast, remappedIds), node.src, node.name, node.virtual, node.visibility, cloneASTNodeImpl(node.vParameters, ast, remappedIds), node.vOverrideSpecifier && cloneASTNodeImpl(node.vOverrideSpecifier, ast, remappedIds), node.vBody && cloneASTNodeImpl(node.vBody, ast, remappedIds), cloneDocumentation(node.documentation, ast, remappedIds), node.nameLocation, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.StructDefinition) {
        newNode = new solc_typed_ast_1.StructDefinition(replaceId(node.id, ast, remappedIds), node.src, node.name, node.scope, node.visibility, node.vMembers.map((o) => cloneASTNodeImpl(o, ast, remappedIds)));
    }
    else if (node instanceof solc_typed_ast_1.VariableDeclaration) {
        newNode = new solc_typed_ast_1.VariableDeclaration(replaceId(node.id, ast, remappedIds), node.src, node.constant, node.indexed, node.name, node.scope, node.stateVariable, node.storageLocation, node.visibility, node.mutability, node.typeString, cloneDocumentation(node.documentation, ast, remappedIds), node.vType && cloneASTNodeImpl(node.vType, ast, remappedIds), node.vOverrideSpecifier && cloneASTNodeImpl(node.vOverrideSpecifier, ast, remappedIds), node.vValue && cloneASTNodeImpl(node.vValue, ast, remappedIds), node.nameLocation);
        //ASTNodeWithChildren------------------------------------------------------
    }
    else if (node instanceof solc_typed_ast_1.ParameterList) {
        newNode = new solc_typed_ast_1.ParameterList(replaceId(node.id, ast, remappedIds), node.src, [...node.vParameters].map((p) => cloneASTNodeImpl(p, ast, remappedIds)), node.raw);
        //Misc---------------------------------------------------------------------
    }
    else if (node instanceof solc_typed_ast_1.IdentifierPath) {
        newNode = new solc_typed_ast_1.IdentifierPath(replaceId(node.id, ast, remappedIds), node.src, node.name, node.referencedDeclaration, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.ModifierInvocation) {
        newNode = new solc_typed_ast_1.ModifierInvocation(replaceId(node.id, ast, remappedIds), node.src, cloneASTNodeImpl(node.vModifierName, ast, remappedIds), node.vArguments.map((a) => cloneASTNodeImpl(a, ast, remappedIds)), node.kind, node.raw);
    }
    else if (node instanceof solc_typed_ast_1.OverrideSpecifier) {
        newNode = new solc_typed_ast_1.OverrideSpecifier(replaceId(node.id, ast, remappedIds), node.src, [...node.vOverrides].map((o) => cloneASTNodeImpl(o, ast, remappedIds)), node.raw);
    }
    if ((0, typeConstructs_1.notNull)(newNode) && sameType(newNode, node)) {
        ast.setContextRecursive(newNode);
        return newNode;
    }
    else {
        throw new errors_1.NotSupportedYetError(`Unable to clone ${(0, astPrinter_1.printNode)(node)}`);
    }
}
function sameType(newNode, ref) {
    return newNode instanceof ref.constructor && ref instanceof newNode.constructor;
}
// When cloning large chunks of the AST, id based references in the resulting subtree
// should refer to newly created nodes, as such we build up a map of id to original -> id of clone
function replaceId(oldId, ast, remappedIds) {
    const id = ast.reserveId();
    if (remappedIds.has(oldId)) {
        throw new errors_1.TranspileFailedError(`Attempted to replace id ${oldId} twice`);
    }
    remappedIds.set(oldId, id);
    return id;
}
// For some types the typechecker can't distinguish between T & U and T in cloneASTNode<T extends ASTNode>
// In such cases separate functions need to be created and called from within cloneASTNodeImpl
function cloneBreak(node, ast, remappedIds) {
    return new solc_typed_ast_1.Break(replaceId(node.id, ast, remappedIds), node.src, cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
}
function cloneContinue(node, ast, remappedIds) {
    return new solc_typed_ast_1.Continue(replaceId(node.id, ast, remappedIds), node.src, cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
}
function clonePlaceholder(node, ast, remappedIds) {
    return new solc_typed_ast_1.PlaceholderStatement(replaceId(node.id, ast, remappedIds), node.src, cloneDocumentation(node.documentation, ast, remappedIds), node.raw);
}
function cloneDocumentation(node, ast, remappedIds) {
    if (typeof node === `string`)
        return node;
    else if (node instanceof solc_typed_ast_1.StructuredDocumentation)
        return new solc_typed_ast_1.StructuredDocumentation(replaceId(node.id, ast, remappedIds), node.src, node.text, node.raw);
    else
        return undefined;
}
exports.cloneDocumentation = cloneDocumentation;
//# sourceMappingURL=cloning.js.map