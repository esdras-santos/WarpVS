"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageReadGen = void 0;
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const base_1 = require("../base");
const serialisation_1 = require("../serialisation");
class StorageReadGen extends base_1.StringIndexedFuncGen {
    // TODO: is typename safe to remove?
    gen(storageLocation, typeName) {
        const valueType = (0, nodeTypeProcessing_1.safeGetNodeType)(storageLocation, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(valueType, typeName);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [storageLocation], this.ast);
    }
    getOrCreateFuncDef(valueType, typeName) {
        typeName = typeName ?? (0, export_1.typeNameFromTypeNode)(valueType, this.ast);
        const resultCairoType = cairoTypeSystem_1.CairoType.fromSol(valueType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const key = resultCairoType.fullStringRepresentation + typeName.typeString;
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(resultCairoType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, cloning_1.cloneASTNode)(typeName, this.ast), solc_typed_ast_1.DataLocation.Storage]], [
            [
                'val',
                (0, cloning_1.cloneASTNode)(typeName, this.ast),
                (0, base_1.locationIfComplexType)(valueType, solc_typed_ast_1.DataLocation.Storage),
            ],
        ], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.View });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(typeToRead) {
        const functionsCalled = [];
        const funcName = `WS${this.generatedFunctionsDef.size}_READ_${typeToRead.typeName}`;
        const resultCairoType = typeToRead.toString();
        const [reads, pack, requiredImports] = (0, serialisation_1.serialiseReads)(typeToRead, readFelt, readId);
        requiredImports.map((i) => {
            const funcDef = this.requireImport(...i);
            if (!functionsCalled.includes(funcDef))
                functionsCalled.push(funcDef);
        });
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        fn ${funcName}(loc: felt252) -> ${resultCairoType}{
          ${reads.map((s) => `  ${s}`).join('\n')}
          ${pack}
        }
      `,
            functionsCalled: functionsCalled,
        };
        return funcInfo;
    }
}
exports.StorageReadGen = StorageReadGen;
function readFelt(offset) {
    return `let read${offset} = WARP_STORAGE::read(${(0, base_1.add)('loc', offset)});`;
}
function readId(offset) {
    return `let read${offset} = readId(${(0, base_1.add)('loc', offset)});`;
}
//# sourceMappingURL=storageRead.js.map