"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTMapper = void 0;
const visitor_1 = require("./visitor");
/*
 The base transpilation pass class.
 Provides a default method for visiting an ASTNode that just visits its children
 and a method to run the pass on each root of the AST separately. This is important
 to make sure that the result of transpiling a file is not affected by which other
 files happen to be present in the transpilation
*/
class ASTMapper extends visitor_1.ASTVisitor {
    constructor() {
        super(...arguments);
        // List of passes that should have been run before this one
        this.prerequisites = new Set();
    }
    addPassPrerequisite(pass_key) {
        this.prerequisites.add(pass_key);
    }
    addInitialPassPrerequisites() {
        return;
    }
    getPassPrerequisites() {
        return this.prerequisites;
    }
    static _getPassPrerequisites() {
        const mapper = new this();
        mapper.addInitialPassPrerequisites();
        return mapper.getPassPrerequisites();
    }
    commonVisit(node, ast) {
        // The slice is for consistency if the node is modified during visiting
        // If you want to add a new child during a visit, and then visit it, you must call dispatchVisit on it yourself
        node.children.slice().forEach((child) => this.dispatchVisit(child, ast));
    }
    static map(ast) {
        ast.roots.forEach((root) => {
            const mapper = new this();
            mapper.dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.ASTMapper = ASTMapper;
//# sourceMappingURL=mapper.js.map