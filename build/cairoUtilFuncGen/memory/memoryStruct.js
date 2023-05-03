"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStructGen = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../warplib/utils");
const base_1 = require("../base");
/*
  Produces functions to allocate memory structs, assign their members, and return their location
  This replaces StructConstructorCalls referencing memory with normal FunctionCalls
*/
class MemoryStructGen extends base_1.StringIndexedFuncGen {
    gen(node) {
        const structDef = node.vReferencedDeclaration;
        assert(structDef instanceof solc_typed_ast_1.StructDefinition);
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(nodeType, structDef);
        structDef.vScope.acceptChildren();
        return (0, functionGeneration_1.createCallToFunction)(funcDef, node.vArguments, this.ast);
    }
    getOrCreateFuncDef(nodeType, structDef) {
        const key = `memoryStruct(${nodeType.pp()},${structDef.name})`;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(nodeType, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        assert(cairoType instanceof cairoTypeSystem_1.CairoStruct);
        const funcInfo = this.getOrCreate(cairoType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, structDef.vMembers.map((decl) => {
            assert(decl.vType !== undefined);
            const type = (0, nodeTypeProcessing_1.typeNameToSpecializedTypeNode)(decl.vType, solc_typed_ast_1.DataLocation.Memory, this.ast.inference);
            return [
                decl.name,
                (0, cloning_1.cloneASTNode)(decl.vType, this.ast),
                type instanceof solc_typed_ast_1.PointerType ? type.location : solc_typed_ast_1.DataLocation.Default,
            ];
        }), [
            [
                'res',
                new solc_typed_ast_1.UserDefinedTypeName(this.ast.reserveId(), '', `struct ${structDef.canonicalName}`, undefined, structDef.id, new solc_typed_ast_1.IdentifierPath(this.ast.reserveId(), '', structDef.name, structDef.id)),
                solc_typed_ast_1.DataLocation.Memory,
            ],
        ], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(structType) {
        const funcName = `WM${this.generatedFunctionsDef.size}_struct_${structType.name}`;
        const mangledStructMembers = [...structType.members.entries()].map(([name, type]) => [`member_${name}`, type]);
        const argString = mangledStructMembers
            .map(([name, type]) => `${name}: ${type.toString()}`)
            .join(', ');
        return {
            name: funcName,
            code: [
                `func ${funcName}{range_check_ptr, warp_memory: DictAccess*}(${argString}) -> (res:felt){`,
                `    alloc_locals;`,
                `    let (start) = wm_alloc(${(0, utils_1.uint256)(structType.width)});`,
                mangledStructMembers
                    .flatMap(([name, type]) => type.serialiseMembers(name))
                    .map(write)
                    .join('\n'),
                `    return (start,);`,
                `}`,
            ].join('\n'),
            functionsCalled: [
                this.requireImport(...importPaths_1.WM_ALLOC),
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.DICT_ACCESS),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
            ],
        };
    }
}
exports.MemoryStructGen = MemoryStructGen;
function write(name, offset) {
    return `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('start', offset)}, ${name});`;
}
//# sourceMappingURL=memoryStruct.js.map