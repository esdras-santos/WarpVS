"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixSuperReference = exports.removeBaseContractDependence = exports.updateReferenceEmitStatements = exports.updateReferencedDeclarations = exports.getBaseContracts = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
function getBaseContracts(node) {
    return node.vLinearizedBaseContracts.slice(1).map((cc) => {
        if (!(cc instanceof cairoNodes_1.CairoContract)) {
            throw new errors_1.TranspileFailedError(`Expected all contracts to be cairo contracts prior to inlining`);
        }
        return cc;
    });
}
exports.getBaseContracts = getBaseContracts;
// Usually overriders remapping should be used to update references, but when the
// contract is specified (through MemberAccess or IdentifierPath), the cloned member
// of that contract is the one that should be used, so the simple remapping is used
// instead.
function updateReferencedDeclarations(node, idRemapping, idRemappingOverriders, ast) {
    node.walk((node) => {
        if (node instanceof solc_typed_ast_1.Identifier) {
            const remapping = idRemappingOverriders.get(node.referencedDeclaration);
            if (remapping !== undefined) {
                node.referencedDeclaration = remapping.id;
                node.name = remapping.name;
            }
        }
        else if (node instanceof solc_typed_ast_1.IdentifierPath) {
            const remapping = isSpecificAccess(node)
                ? idRemapping.get(node.referencedDeclaration)
                : idRemappingOverriders.get(node.referencedDeclaration);
            if (remapping !== undefined) {
                node.referencedDeclaration = remapping.id;
                node.name = remapping.name;
            }
        }
        else if (node instanceof solc_typed_ast_1.MemberAccess) {
            const remapping = idRemapping.get(node.referencedDeclaration);
            if (remapping !== undefined && !node.typeString.includes(' external ')) {
                ast.replaceNode(node, new solc_typed_ast_1.Identifier(ast.reserveId(), node.src, node.typeString, remapping.name, remapping.id, node.raw));
            }
        }
    });
}
exports.updateReferencedDeclarations = updateReferencedDeclarations;
function updateReferenceEmitStatements(node, idRemapping, ast) {
    node.walk((node) => {
        if (node instanceof solc_typed_ast_1.EmitStatement) {
            const oldEventDef = node.vEventCall.vReferencedDeclaration;
            (0, assert_1.default)(oldEventDef instanceof solc_typed_ast_1.EventDefinition);
            const newEventDef = idRemapping.get(oldEventDef.id);
            if (newEventDef !== undefined) {
                const replaceNode = new solc_typed_ast_1.EmitStatement(ast.reserveId(), '', (0, functionGeneration_1.createCallToEvent)(newEventDef, node.vEventCall.vExpression.typeString, node.vEventCall.vArguments, ast));
                ast.replaceNode(node, replaceNode);
            }
        }
    });
}
exports.updateReferenceEmitStatements = updateReferenceEmitStatements;
function removeBaseContractDependence(node) {
    const toRemove = node.children.filter((child) => child instanceof solc_typed_ast_1.InheritanceSpecifier);
    toRemove.forEach((inheritanceSpecifier) => node.removeChild(inheritanceSpecifier));
}
exports.removeBaseContractDependence = removeBaseContractDependence;
// IdentifierPath doesn't make distinctions between calling function f() or A.f()
// The only difference is the string of the name ('f' or 'A.f' respectively), so
// the string is parsed in order to obtain whether the contract is being specified.
function isSpecificAccess(node) {
    const name = node.name.split('.');
    return name.length > 1;
}
// Check whether there is a statement in the body of the node that is a member access
// to super. If that is the case, it needs to fix the reference of that member access
// to the correct function in the linearized order of contract
function fixSuperReference(node, base, contract) {
    node.walk((n) => {
        if (n instanceof solc_typed_ast_1.MemberAccess && isSuperAccess(n)) {
            const superFunc = findSuperReferenceNode(n.memberName, base, contract);
            n.referencedDeclaration = superFunc.id;
        }
    });
}
exports.fixSuperReference = fixSuperReference;
function isSuperAccess(n) {
    const expr = n.vExpression;
    return expr instanceof solc_typed_ast_1.Identifier && expr.name === 'super';
}
// In the `base` contract there is a super member access, which points to the corresponding
// function in the linearized order of contracts of `base`. However, it should be pointing
// to this function in the linearized order of contracts of `contract`; so the contracts
// after `base` should be reviewed in this order looking for the correct function to fix
// the reference
function findSuperReferenceNode(funcName, base, node) {
    let contractFound = false;
    for (const contract of getBaseContracts(node)) {
        if (contractFound) {
            const functions = contract
                .getChildren()
                .filter((declaration) => declaration instanceof solc_typed_ast_1.FunctionDefinition && declaration.name === funcName);
            (0, assert_1.default)(functions.length <= 1, `Function ${funcName} is defined multiple times in the same contract`);
            if (functions.length === 1)
                return functions[0];
        }
        else {
            contractFound = contract.id === base.id;
        }
    }
    throw new errors_1.TranspileFailedError(`Function ${funcName} was not found in super contracts`);
}
//# sourceMappingURL=utils.js.map