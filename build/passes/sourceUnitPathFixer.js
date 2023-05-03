"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceUnitPathFixer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mapper_1 = require("../ast/mapper");
class SourceUnitPathFixer extends mapper_1.ASTMapper {
    constructor(includePaths) {
        super();
        this.includePaths = includePaths;
    }
    visitSourceUnit(node, _ast) {
        if (!fs_1.default.existsSync(node.absolutePath)) {
            for (const prefix of this.includePaths) {
                const filePath = path_1.default.join(prefix, node.absolutePath);
                if (fs_1.default.existsSync(filePath)) {
                    node.absolutePath = filePath;
                    break;
                }
            }
        }
    }
    static map_(ast, includePaths) {
        ast.roots.forEach((root) => {
            const mapper = new this(includePaths);
            mapper.dispatchVisit(root, ast);
        });
        return ast;
    }
}
exports.SourceUnitPathFixer = SourceUnitPathFixer;
//# sourceMappingURL=sourceUnitPathFixer.js.map