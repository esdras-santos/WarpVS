"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryToCallDataGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
const endent_1 = __importDefault(require("endent"));
class MemoryToCallDataGen extends base_1.StringIndexedFuncGen {
    constructor(dynamicArrayStructGen, memoryReadGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynamicArrayStructGen = dynamicArrayStructGen;
        this.memoryReadGen = memoryReadGen;
    }
    gen(node) {
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(type);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [node], this.ast);
    }
    getOrCreateFuncDef(type) {
        const key = type.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['mem_loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Memory]], [['retData', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.CallData]], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.Pure });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from memory to calldata not implemented yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type) => this.createStructCopyFunction(type), unexpectedTypeFunc, unexpectedTypeFunc);
    }
    createStructCopyFunction(type) {
        (0, assert_1.default)(type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition);
        const structDef = type.definition;
        const outputType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const [code, funcCalls] = structDef.vMembers
            .map((decl) => (0, nodeTypeProcessing_1.safeGetNodeType)(decl, this.ast.inference))
            .reduce(([code, funcCalls, offset], type, index) => {
            const [copyCode, copyFuncCalls, newOffset] = this.generateElementCopyCode(type, offset, index);
            return [[...code, ...copyCode], [...funcCalls, ...copyFuncCalls], newOffset];
        }, [new Array(), new Array(), 0]);
        const funcName = `wm_to_calldata${this.generatedFunctionsDef.size}_struct_${structDef.name}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(mem_loc : felt) -> (ret_data: ${outputType.toString()}){
          alloc_locals;
          ${code.join('\n')}
          return (${outputType.toString()}(${(0, utils_1.mapRange)(structDef.vMembers.length, (n) => `member${n}`)}),);
        }
      `,
            functionsCalled: funcCalls,
        };
    }
    // TODO: With big static arrays, this functions gets huge. Can that be fixed?!
    createStaticArrayCopyFunction(type) {
        const outputType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(type.size !== undefined);
        const length = (0, utils_1.narrowBigIntSafe)(type.size);
        const elementT = type.elementT;
        const memberFeltSize = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast).width;
        const [copyCode, funcCalls] = (0, utils_1.mapRange)(length, (n) => {
            const [memberCopyCode, memberCalls] = this.generateElementCopyCode(elementT, n * memberFeltSize, n);
            return [memberCopyCode, memberCalls];
        }).reduce(([copyCode, funcCalls], [memberCode, memberCalls]) => [
            [...copyCode, ...memberCode],
            [...funcCalls, ...memberCalls],
        ]);
        const funcName = `wm_to_calldata_static_array${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        fn ${funcName}(mem_loc : felt) -> ${outputType.toString()} {
          ${copyCode.join('\n')}
          return (${(0, utils_1.mapRange)(length, (n) => `member${n}`)});
        }`,
            functionsCalled: funcCalls,
        };
    }
    createDynamicArrayCopyFunction(type) {
        const outputType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(outputType instanceof cairoTypeSystem_1.CairoDynArray);
        (0, assert_1.default)(type instanceof solc_typed_ast_1.ArrayType || type instanceof solc_typed_ast_1.BytesType || type instanceof solc_typed_ast_1.StringType);
        (0, assert_1.default)((0, nodeTypeProcessing_1.getSize)(type) === undefined);
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        if ((0, nodeTypeProcessing_1.isDynamicArray)(elementT)) {
            throw new errors_1.NotSupportedYetError(`Copying dynamic arrays with element type ${(0, astPrinter_1.printTypeNode)(elementT)} from memory to calldata is not supported yet`);
        }
        const dynArrayReaderInfo = this.createDynArrayReader(elementT);
        const calldataDynArrayStruct = this.dynamicArrayStructGen.getOrCreateFuncDef(type);
        const funcName = `wm_to_calldata_dynamic_array${this.generatedFunctionsDef.size}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        ${dynArrayReaderInfo.code}
        #[implicit(warp_memory)]
        func ${funcName}(mem_loc: felt) -> (retData: ${outputType.toString()}){
            alloc_locals;
            let (len_256) = wm_read_256(mem_loc);
            let (ptr : ${outputType.vPtr.toString()}) = alloc();
            let (len_felt) = narrow_safe(len_256);
            ${dynArrayReaderInfo.name}(len_felt, ptr, mem_loc + 2);
            return (${calldataDynArrayStruct.name}(len=len_felt, ptr=ptr),);
        }
        `,
            functionsCalled: [
                this.requireImport(...importPaths_1.ALLOC),
                this.requireImport(...importPaths_1.NARROW_SAFE),
                this.requireImport([...importPaths_1.WARPLIB_MEMORY], 'wm_read_256'),
                calldataDynArrayStruct,
                ...dynArrayReaderInfo.functionsCalled,
            ],
        };
        return funcInfo;
    }
    createDynArrayReader(elementT) {
        const funcName = `wm_to_calldata_dynamic_array_reader${this.generatedFunctionsDef.size}`;
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const memWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
        const ptrString = `${cairoType.toString()}`;
        const readFunc = this.memoryReadGen.getOrCreateFuncDef(elementT);
        let code;
        let funcCalls;
        if ((0, nodeTypeProcessing_1.isReferenceType)(elementT)) {
            const allocSize = (0, nodeTypeProcessing_1.isDynamicArray)(elementT)
                ? 2
                : cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
            const auxFunc = this.getOrCreateFuncDef(elementT);
            code = [
                `let (mem_read0) = ${readFunc.name}(mem_loc, ${(0, utils_2.uint256)(allocSize)});`,
                `let (mem_read1) = ${auxFunc.name}(mem_read0);`,
                `assert ptr[0] = mem_read1;`,
            ];
            funcCalls = [this.requireImport(...importPaths_1.U128_FROM_FELT), auxFunc, readFunc];
        }
        else {
            code = [`let (mem_read0) = ${readFunc.name}(mem_loc);`, 'assert ptr[0] = mem_read0;'];
            funcCalls = [readFunc];
        }
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(len: felt, ptr: ${ptrString}*, mem_loc: felt) -> (){
            alloc_locals;
            if (len == 0){
                 return ();
            }
            ${code.join('\n')}
            ${funcName}(len=len - 1, ptr=ptr + ${cairoType.width}, mem_loc=mem_loc + ${memWidth});
            return ();
        }
      `,
            functionsCalled: funcCalls,
        };
    }
    generateElementCopyCode(type, offset, index) {
        const readFunc = this.memoryReadGen.getOrCreateFuncDef(type);
        if ((0, nodeTypeProcessing_1.isReferenceType)(type)) {
            const memberGetterFunc = this.getOrCreateFuncDef(type);
            const allocSize = (0, nodeTypeProcessing_1.isDynamicArray)(type)
                ? 2
                : cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref).width;
            return [
                [
                    `let read_${index} = ${readFunc.name}(${(0, base_1.add)('mem_loc', offset)}, ${(0, utils_2.uint256)(allocSize)});`,
                    `let member${index}= ${memberGetterFunc.name}(read_${index});`,
                ],
                [this.requireImport(...importPaths_1.U128_FROM_FELT), memberGetterFunc, readFunc],
                offset + 1,
            ];
        }
        const memberFeltSize = cairoTypeSystem_1.CairoType.fromSol(type, this.ast).width;
        return [
            [`let member${index} = *warp_memory.at(u32_from_felt252(${(0, base_1.add)('mem_loc', offset)}));`],
            [this.requireImport(...importPaths_1.U32_FROM_FELT)],
            offset + memberFeltSize,
        ];
    }
}
exports.MemoryToCallDataGen = MemoryToCallDataGen;
//# sourceMappingURL=memoryToCalldata.js.map