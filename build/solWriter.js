"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoToSolASTWriterMapping = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("./ast/cairoNodes");
class CairoContractSolWriter extends solc_typed_ast_1.ASTNodeWriter {
    writeInner(node, writer) {
        const result = [];
        if (node.dynamicStorageAllocations.size + node.staticStorageAllocations.size > 0) {
            result.push('<cairo information - multiline start> storage allocations\n');
            node.dynamicStorageAllocations.forEach((idx, varDecl) => {
                result.push(`${idx}: ${writer.write(varDecl)}\n`);
            });
            node.staticStorageAllocations.forEach((idx, varDecl) => {
                result.push(`${idx}: ${writer.write(varDecl)}\n`);
            });
            result.push('<cairo information - multiline end>\n\n');
        }
        const solContract = new solc_typed_ast_1.ContractDefinition(node.id, node.src, node.name, node.scope, node.kind, node.abstract, node.fullyImplemented, node.linearizedBaseContracts, node.usedErrors, node.documentation, node.children, node.nameLocation, node.raw);
        result.push(writer.write(solContract));
        return result;
    }
}
class CairoFunctionDefinitionSolWriter extends solc_typed_ast_1.ASTNodeWriter {
    constructor(printStubs) {
        super();
        this.printStubs = printStubs;
    }
    writeInner(node, writer) {
        if (node.functionStubKind !== cairoNodes_1.FunctionStubKind.None && !this.printStubs)
            return [];
        const result = [];
        if (node.implicits.size > 0) {
            const formatter = writer.formatter;
            result.push(...[
                `<cairo information> implicits: ${writer.desc(new Array(...node.implicits).join(', '))}`,
                formatter.renderIndent(),
            ].join('\n'));
        }
        const solFunctionDefinition = new solc_typed_ast_1.FunctionDefinition(node.id, node.src, node.scope, node.kind, node.name, node.virtual, node.visibility, node.stateMutability, node.isConstructor, node.vParameters, node.vReturnParameters, node.vModifiers, node.vOverrideSpecifier, node.vBody, node.documentation, node.nameLocation, node.raw);
        result.push(writer.write(solFunctionDefinition));
        return result;
    }
}
class CairoGeneratedFunctionDefinitionSolWriter extends solc_typed_ast_1.ASTNodeWriter {
    writeInner(node, _writer) {
        return [node.rawStringDefinition];
    }
}
class CairoImportFunctionDefinitionSolWriter extends solc_typed_ast_1.ASTNodeWriter {
    writeInner(node, _writer) {
        return [`from ${node.path} import ${node.name}`];
    }
}
class CairoAssertSolWriter extends solc_typed_ast_1.ASTNodeWriter {
    writeInner(node, writer) {
        const result = [];
        result.push(`<cairo information> assert ${writer.write(node.vExpression)} = 1`);
        return result;
    }
}
const CairoExtendedASTWriterMapping = (printStubs) => new Map([
    [cairoNodes_1.CairoContract, new CairoContractSolWriter()],
    [cairoNodes_1.CairoFunctionDefinition, new CairoFunctionDefinitionSolWriter(printStubs)],
    [cairoNodes_1.CairoGeneratedFunctionDefinition, new CairoGeneratedFunctionDefinitionSolWriter()],
    [cairoNodes_1.CairoImportFunctionDefinition, new CairoImportFunctionDefinitionSolWriter()],
    [cairoNodes_1.CairoAssert, new CairoAssertSolWriter()],
]);
const CairoToSolASTWriterMapping = (printStubs) => new Map([
    ...solc_typed_ast_1.DefaultASTWriterMapping,
    ...CairoExtendedASTWriterMapping(printStubs),
]);
exports.CairoToSolASTWriterMapping = CairoToSolASTWriterMapping;
//# sourceMappingURL=solWriter.js.map