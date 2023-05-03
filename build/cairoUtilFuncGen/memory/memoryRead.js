"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryReadGen = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const base_1 = require("../base");
const serialisation_1 = require("../serialisation");
/*
  Produces functions that when given a start location in warp_memory, deserialise all necessary
  felts to produce a full value. For example, a function to read a Uint256 reads the given location
  and the next one, and combines them into a Uint256 struct
*/
class MemoryReadGen extends base_1.StringIndexedFuncGen {
    gen(memoryRef) {
        const valueType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(memoryRef, this.ast.inference))[0];
        const resultCairoType = cairoTypeSystem_1.CairoType.fromSol(valueType, this.ast);
        const args = [memoryRef];
        if (resultCairoType instanceof cairoTypeSystem_1.MemoryLocation) {
            // The size parameter represents how much space to allocate
            // for the contents of the newly accessed subobject
            args.push((0, nodeTemplates_1.createNumberLiteral)((0, nodeTypeProcessing_1.isDynamicArray)(valueType)
                ? 2
                : cairoTypeSystem_1.CairoType.fromSol(valueType, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation).width, this.ast, 'uint256'));
        }
        const funcDef = this.getOrCreateFuncDef(valueType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, args, this.ast);
    }
    getOrCreateFuncDef(typeToRead) {
        const key = typeToRead.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const typeToReadName = (0, export_1.typeNameFromTypeNode)(typeToRead, this.ast);
        const resultCairoType = cairoTypeSystem_1.CairoType.fromSol(typeToRead, this.ast);
        const inputs = resultCairoType instanceof cairoTypeSystem_1.MemoryLocation
            ? [
                ['loc', (0, cloning_1.cloneASTNode)(typeToReadName, this.ast), solc_typed_ast_1.DataLocation.Memory],
                ['size', (0, nodeTemplates_1.createNumberTypeName)(256, false, this.ast), solc_typed_ast_1.DataLocation.Default],
            ]
            : [['loc', (0, cloning_1.cloneASTNode)(typeToReadName, this.ast), solc_typed_ast_1.DataLocation.Memory]];
        const outputs = [
            [
                'val',
                (0, cloning_1.cloneASTNode)(typeToReadName, this.ast),
                (0, base_1.locationIfComplexType)(typeToRead, solc_typed_ast_1.DataLocation.Memory),
            ],
        ];
        let funcDef;
        if (resultCairoType instanceof cairoTypeSystem_1.MemoryLocation) {
            funcDef = this.requireImport(...importPaths_1.WM_READ_ID, inputs, outputs);
        }
        else if (resultCairoType instanceof cairoTypeSystem_1.CairoFelt) {
            funcDef = this.requireImport(...importPaths_1.WM_READ_FELT, inputs, outputs);
        }
        else if (resultCairoType instanceof cairoTypeSystem_1.CairoUint) {
            funcDef = this.requireImport([...importPaths_1.WARPLIB_MEMORY], `wm_read_${resultCairoType.nBits}`, inputs, outputs);
        }
        else {
            const funcInfo = this.getOrCreate(resultCairoType);
            funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, inputs, outputs, this.ast, this.sourceUnit, {
                mutability: solc_typed_ast_1.FunctionStateMutability.View,
            });
        }
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(typeToRead) {
        const funcName = `WM${this.generatedFunctionsDef.size}_READ_${typeToRead.typeName}`;
        const resultCairoType = typeToRead.toString();
        const [reads, pack] = (0, serialisation_1.serialiseReads)(typeToRead, readFelt, readFelt);
        const funcInfo = {
            name: funcName,
            code: [
                `func ${funcName}{range_check_ptr, warp_memory : DictAccess*}(loc: felt) ->(val: ${resultCairoType}){`,
                `    alloc_locals;`,
                ...reads.map((s) => `    ${s}`),
                `    return (${pack},);`,
                '}',
            ].join('\n'),
            functionsCalled: [this.requireImport(...importPaths_1.DICT_READ)],
        };
        return funcInfo;
    }
}
exports.MemoryReadGen = MemoryReadGen;
function readFelt(offset) {
    return `let (read${offset}) = dict_read{dict_ptr=warp_memory}(${(0, base_1.add)('loc', offset)});`;
}
//# sourceMappingURL=memoryRead.js.map