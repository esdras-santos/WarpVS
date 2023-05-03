"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejectPrefix = void 0;
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
const nameModifiers_1 = require("../utils/nameModifiers");
class RejectPrefix extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.forbiddenPrefix = [nameModifiers_1.MANGLED_WARP];
        this.rejectedNames = [];
    }
    checkNoPrefixMatch(name, node) {
        this.forbiddenPrefix.forEach((prefix) => {
            if (name.startsWith(prefix))
                this.rejectedNames.push([
                    `Names starting with ${prefix} are not allowed in the code`,
                    node,
                ]);
        });
    }
    static map(ast) {
        const rejectedPerSource = new Map();
        ast.roots.forEach((sourceUnit) => {
            const mapper = new this();
            mapper.dispatchVisit(sourceUnit, ast);
            if (mapper.rejectedNames.length > 0)
                rejectedPerSource.set(sourceUnit.absolutePath, mapper.rejectedNames);
        });
        if (rejectedPerSource.size > 0)
            throw new errors_1.WillNotSupportError((0, errors_1.getErrorMessage)(rejectedPerSource, `Identifiers with not allowed prefixes were detected:`), undefined, false);
        return ast;
    }
    visitStructDefinition(node, ast) {
        this.checkNoPrefixMatch(node.name, node);
        this.commonVisit(node, ast);
    }
    visitVariableDeclaration(node, ast) {
        this.checkNoPrefixMatch(node.name, node);
        this.commonVisit(node, ast);
    }
    visitFunctionDefinition(node, ast) {
        this.checkNoPrefixMatch(node.name, node);
        this.commonVisit(node, ast);
    }
    visitContractDefinition(node, ast) {
        this.checkNoPrefixMatch(node.name, node);
        this.commonVisit(node, ast);
    }
    visitEventDefinition(node, ast) {
        this.checkNoPrefixMatch(node.name, node);
        this.commonVisit(node, ast);
    }
}
exports.RejectPrefix = RejectPrefix;
//# sourceMappingURL=rejectPrefix.js.map