"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectReachableStatementsImpl = exports.collectReachableStatements = exports.hasPathWithoutReturn = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
function hasPathWithoutReturn(statement) {
    if (statement instanceof solc_typed_ast_1.Block || statement instanceof solc_typed_ast_1.UncheckedBlock) {
        return statement.vStatements.every(hasPathWithoutReturn);
    }
    else if (statement instanceof solc_typed_ast_1.IfStatement) {
        if (hasPathWithoutReturn(statement.vTrueBody)) {
            return true;
        }
        return statement.vFalseBody === undefined || hasPathWithoutReturn(statement.vFalseBody);
    }
    return !(statement instanceof solc_typed_ast_1.Return);
}
exports.hasPathWithoutReturn = hasPathWithoutReturn;
// collects the reachable statements within the given one
// proper use would be to pass the body of a function, for example
function collectReachableStatements(statement) {
    // This is created up front for space efficiency, to avoid constant creation and unions of sets
    const reachableStatements = new Set();
    collectReachableStatementsImpl(statement, reachableStatements);
    return reachableStatements;
}
exports.collectReachableStatements = collectReachableStatements;
// inserts reachable statements into collection,
// and returns whether or not execution can continue past the given statement
function collectReachableStatementsImpl(statement, collection) {
    collection.add(statement);
    if (statement instanceof solc_typed_ast_1.Block || statement instanceof solc_typed_ast_1.UncheckedBlock) {
        for (const subStatement of statement.vStatements) {
            const flowContinues = collectReachableStatementsImpl(subStatement, collection);
            if (!flowContinues)
                return false;
        }
        return true;
    }
    else if (statement instanceof solc_typed_ast_1.IfStatement) {
        const flowGetsThroughTrue = collectReachableStatementsImpl(statement.vTrueBody, collection);
        const flowGetsThroughFalse = !statement.vFalseBody || collectReachableStatementsImpl(statement.vFalseBody, collection);
        return flowGetsThroughTrue || flowGetsThroughFalse;
    }
    else if (statement instanceof solc_typed_ast_1.Return) {
        return false;
    }
    else {
        return true;
    }
}
exports.collectReachableStatementsImpl = collectReachableStatementsImpl;
//# sourceMappingURL=controlFlowAnalyser.js.map