"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoredPointerDereference = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const referenceSubPass_1 = require("./referenceSubPass");
class StoredPointerDereference extends referenceSubPass_1.ReferenceSubPass {
    visitPotentialStoredPointer(node, ast) {
        // First, collect data before any processing
        const originalNode = node;
        const [actualLoc, expectedLoc] = this.getLocations(node);
        if (expectedLoc === undefined) {
            return this.visitExpression(node, ast);
        }
        const utilFuncGen = ast.getUtilFuncGen(node);
        const parent = node.parent;
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        // Next, if the node is a type that requires an extra read, insert this first
        let readFunc = null;
        if (actualLoc === solc_typed_ast_1.DataLocation.Storage && ((0, nodeTypeProcessing_1.isDynamicArray)(nodeType) || (0, nodeTypeProcessing_1.isMapping)(nodeType))) {
            readFunc = utilFuncGen.storage.read.gen(node);
        }
        else if (actualLoc === solc_typed_ast_1.DataLocation.Memory && (0, nodeTypeProcessing_1.isReferenceType)(nodeType)) {
            readFunc = utilFuncGen.memory.read.gen(node);
        }
        if (readFunc !== null) {
            this.replace(node, readFunc, parent, actualLoc, expectedLoc, ast);
            if (actualLoc === undefined) {
                this.expectedDataLocations.delete(node);
            }
            else {
                this.expectedDataLocations.set(node, actualLoc);
            }
        }
        // Now that node has been inserted into the appropriate functions, read its children
        this.visitExpression(originalNode, ast);
    }
    visitIndexAccess(node, ast) {
        this.visitPotentialStoredPointer(node, ast);
    }
    visitMemberAccess(node, ast) {
        this.visitPotentialStoredPointer(node, ast);
    }
    visitAssignment(node, ast) {
        const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vLeftHandSide, ast.inference);
        if ((0, nodeTypeProcessing_1.isComplexMemoryType)(lhsType)) {
            this.visitExpression(node.vLeftHandSide, ast);
            this.dispatchVisit(node.vRightHandSide, ast);
        }
        else {
            this.visitExpression(node, ast);
        }
    }
}
exports.StoredPointerDereference = StoredPointerDereference;
//# sourceMappingURL=storedPointerDereference.js.map