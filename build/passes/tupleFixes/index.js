"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleFixes = void 0;
const mapper_1 = require("../../ast/mapper");
const tupleFiller_1 = require("./tupleFiller");
const tupleFlattener_1 = require("./tupleFlattener");
class TupleFixes extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        tupleFlattener_1.TupleFlattener.map(ast);
        tupleFiller_1.TupleFiller.map(ast);
        return ast;
    }
}
exports.TupleFixes = TupleFixes;
//# sourceMappingURL=index.js.map