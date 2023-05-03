"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryWriteGen = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
/*
  Produces functions to write a given value into warp_memory, returning that value (to simulate assignments)
  This involves serialising the data into a series of felts and writing each one into the DictAccess
*/
class MemoryWriteGen extends base_1.StringIndexedFuncGen {
    gen(memoryRef, writeValue) {
        const typeToWrite = (0, nodeTypeProcessing_1.safeGetNodeType)(memoryRef, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(typeToWrite);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [memoryRef, writeValue], this.ast);
    }
    getOrCreateFuncDef(typeToWrite) {
        const key = typeToWrite.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const argTypeName = (0, utils_1.typeNameFromTypeNode)(typeToWrite, this.ast);
        const inputs = [
            ['loc', argTypeName, solc_typed_ast_1.DataLocation.Memory],
            [
                'value',
                (0, cloning_1.cloneASTNode)(argTypeName, this.ast),
                typeToWrite instanceof solc_typed_ast_1.PointerType ? solc_typed_ast_1.DataLocation.Memory : solc_typed_ast_1.DataLocation.Default,
            ],
        ];
        const outputs = [
            [
                'res',
                (0, cloning_1.cloneASTNode)(argTypeName, this.ast),
                typeToWrite instanceof solc_typed_ast_1.PointerType ? solc_typed_ast_1.DataLocation.Memory : solc_typed_ast_1.DataLocation.Default,
            ],
        ];
        const cairoTypeToWrite = cairoTypeSystem_1.CairoType.fromSol(typeToWrite, this.ast);
        if (cairoTypeToWrite instanceof cairoTypeSystem_1.CairoFelt) {
            return this.requireImport(...importPaths_1.WM_WRITE_FELT, inputs, outputs);
        }
        if (cairoTypeToWrite instanceof cairoTypeSystem_1.CairoUint) {
            return this.requireImport([...importPaths_1.WARPLIB_MEMORY], `wm_write_${cairoTypeToWrite.nBits}`, inputs, outputs);
        }
        const funcInfo = this.getOrCreate(typeToWrite);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, inputs, outputs, this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(typeToWrite) {
        const cairoTypeToWrite = cairoTypeSystem_1.CairoType.fromSol(typeToWrite, this.ast);
        const cairoTypeString = cairoTypeToWrite.toString();
        const funcName = `WM_WRITE${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: [
                `func ${funcName}{warp_memory : DictAccess*}(loc: felt, value: ${cairoTypeString}) -> (res: ${cairoTypeString}){`,
                ...cairoTypeToWrite
                    .serialiseMembers('value')
                    .map((name, index) => `    ${write(index, name)};`),
                '    return (value,);',
                '}',
            ].join('\n'),
            functionsCalled: [this.requireImport(...importPaths_1.DICT_WRITE)],
        };
        return funcInfo;
    }
}
exports.MemoryWriteGen = MemoryWriteGen;
function write(offset, value) {
    return `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('loc', offset)}, ${value});`;
}
//# sourceMappingURL=memoryWrite.js.map