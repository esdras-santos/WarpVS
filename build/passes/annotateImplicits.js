"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotateImplicits = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const mapper_1 = require("../ast/mapper");
const visitor_1 = require("../ast/visitor");
const astPrinter_1 = require("../utils/astPrinter");
const utils_1 = require("../utils/utils");
const cairoStubProcessor_1 = require("./cairoStubProcessor");
const cairoParsing_1 = require("../utils/cairoParsing");
class AnnotateImplicits extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            'Tic', // Type builtins are not handled at this stage
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitCairoFunctionDefinition(node, ast) {
        this.commonVisit(node, ast);
    }
    visitFunctionDefinition(node, ast) {
        const implicits = new ImplicitCollector(node).collect(ast);
        const annotatedFunction = new cairoNodes_1.CairoFunctionDefinition(node.id, node.src, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, node.vParameters, node.vReturnParameters, node.vModifiers, implicits, cairoNodes_1.FunctionStubKind.None, false, // acceptsRawDArray
        false, // acceptsUnpackedStructArray
        node.vOverrideSpecifier, node.vBody, node.documentation, node.nameLocation, node.raw);
        ast.replaceNode(node, annotatedFunction);
        node.children.forEach((child) => this.dispatchVisit(child, ast));
    }
}
exports.AnnotateImplicits = AnnotateImplicits;
class ImplicitCollector extends visitor_1.ASTVisitor {
    constructor(root) {
        super();
        this.visited = new Set();
        this.root = root;
    }
    commonVisit(node, ast) {
        (0, assert_1.default)(!this.visited.has(node), `Implicit collected visited ${(0, astPrinter_1.printNode)(node)} twice`);
        this.visited.add(node);
        return node.children
            .map((child) => this.dispatchVisit(child, ast))
            .reduce((acc, set) => {
            set.forEach((implicit) => acc.add(implicit));
            return acc;
        }, new Set());
    }
    collect(ast) {
        // To avoid cycles, visitFunctionDefinition does not recurse when visiting root,
        // however it is needed for if root is a public function
        return (0, utils_1.union)(this.visitFunctionDefinition(this.root, ast), this.commonVisit(this.root, ast));
    }
    visitCairoFunctionDefinition(node, _ast) {
        this.visited.add(node);
        return node.implicits;
    }
    visitFunctionDefinition(node, ast) {
        const result = new Set();
        if ((0, cairoStubProcessor_1.isCairoStub)(node)) {
            extractImplicitFromStubs(node, result);
            return node === this.root ? result : (0, utils_1.union)(result, this.commonVisit(node, ast));
        }
        if (node === this.root)
            return result;
        return (0, utils_1.union)(result, this.commonVisit(node, ast));
    }
    visitFunctionCall(node, ast) {
        const result = this.commonVisit(node, ast);
        if (node.vReferencedDeclaration !== this.root &&
            (node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition ||
                node.vReferencedDeclaration instanceof solc_typed_ast_1.EventDefinition) &&
            !this.visited.has(node.vReferencedDeclaration)) {
            this.dispatchVisit(node.vReferencedDeclaration, ast).forEach((defn) => result.add(defn));
        }
        return result;
    }
    visitEventDefinition(node, ast) {
        const result = this.commonVisit(node, ast);
        return result;
    }
}
function extractImplicitFromStubs(node, result) {
    const cairoCode = (0, cairoStubProcessor_1.getDocString)(node.documentation);
    (0, assert_1.default)(cairoCode !== undefined);
    const rawCairoFunctionInfo = (0, cairoParsing_1.getRawCairoFunctionInfo)(cairoCode);
    rawCairoFunctionInfo.implicits.forEach((impl) => result.add(impl));
}
//# sourceMappingURL=annotateImplicits.js.map