"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallDataToMemoryGen = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const assert_1 = __importDefault(require("assert"));
const functionGeneration_1 = require("../../utils/functionGeneration");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const base_1 = require("../base");
const utils_1 = require("../../warplib/utils");
const errors_1 = require("../../utils/errors");
const astPrinter_1 = require("../../utils/astPrinter");
const utils_2 = require("../../utils/utils");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
class CallDataToMemoryGen extends base_1.StringIndexedFuncGen {
    gen(node) {
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(type);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [node], this.ast);
    }
    getOrCreateFuncDef(type) {
        const key = type.pp();
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['calldata', (0, utils_2.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.CallData]], [['mem_loc', (0, utils_2.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.Pure });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from calldata to memory not implemented yet`);
        };
        const funcInfo = (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type, def) => this.createStructCopyFunction(type, def), unexpectedTypeFunc, unexpectedTypeFunc);
        return funcInfo;
    }
    createDynamicArrayCopyFunction(type) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(type);
        const size = (0, nodeTypeProcessing_1.getSize)(type);
        (0, assert_1.default)(size === undefined);
        const callDataType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(callDataType instanceof cairoTypeSystem_1.CairoDynArray);
        const memoryElementWidth = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast).width;
        let copyCode;
        let auxFunc;
        if ((0, nodeTypeProcessing_1.isReferenceType)(elementT)) {
            const recursiveFunc = this.getOrCreateFuncDef(elementT);
            copyCode = (0, endent_1.default) `
        let cdElem = calldata[0];
        let (mElem) = ${recursiveFunc.name}(cdElem);
        dict_write{dict_ptr=warp_memory}(mem_start, mElem);
      `;
            auxFunc = recursiveFunc;
        }
        else if (memoryElementWidth === 2) {
            copyCode = (0, endent_1.default) `
        dict_write{dict_ptr=warp_memory}(mem_start, calldata[0].low);
        dict_write{dict_ptr=warp_memory}(mem_start+1, calldata[0].high);
      `;
            auxFunc = this.requireImport(...importPaths_1.DICT_WRITE);
        }
        else {
            copyCode = `dict_write{dict_ptr=warp_memory}(mem_start, calldata[0]);`;
            auxFunc = this.requireImport(...importPaths_1.DICT_WRITE);
        }
        const funcName = `cd_to_memory_dynamic_array${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}_elem(calldata: ${callDataType.vPtr}, mem_start: felt, length: felt){
            alloc_locals;
            if (length == 0){
                return ();
            }
            ${copyCode}
            return ${funcName}_elem(calldata + ${callDataType.vPtr.to.width}, mem_start + ${memoryElementWidth}, length - 1);
        }
        #[implicit(warp_memory)]
        func ${funcName}(calldata : ${callDataType}) -> (mem_loc: felt){
            alloc_locals;
            let (len256) = felt_to_uint256(calldata.len);
            let (mem_start) = wm_new(len256, ${(0, utils_1.uint256)(memoryElementWidth)});
            ${funcName}_elem(calldata.ptr, mem_start + 2, calldata.len);
            return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.WM_NEW),
                this.requireImport(...importPaths_1.FELT_TO_UINT256),
                auxFunc,
            ],
        };
    }
    createStaticArrayCopyFunction(type) {
        (0, assert_1.default)(type.size !== undefined);
        const callDataType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const memoryType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        const memoryElementWidth = cairoTypeSystem_1.CairoType.fromSol(type.elementT, this.ast).width;
        const memoryOffsetMultiplier = memoryElementWidth === 1 ? '' : `* ${memoryElementWidth}`;
        const loc = (index) => index === 0 ? `mem_start` : `mem_start  + ${index}${memoryOffsetMultiplier}`;
        let copyCode;
        let funcCalls = [];
        if ((0, nodeTypeProcessing_1.isReferenceType)(type.elementT)) {
            const recursiveFunc = this.getOrCreateFuncDef(type.elementT);
            copyCode = (index) => (0, endent_1.default) `
          let cdElem = calldata[${index}];
          let (mElem) = ${recursiveFunc.name}(cdElem);
          dict_write{dict_ptr=warp_memory}(${loc(index)}, mElem);
        `;
            funcCalls = [recursiveFunc];
        }
        else if (memoryElementWidth === 2) {
            copyCode = (index) => (0, endent_1.default) `
          dict_write{dict_ptr=warp_memory}(${loc(index)}, calldata[${index}].low);
          dict_write{dict_ptr=warp_memory}(${loc(index)} + 1, calldata[${index}].high);
        `;
        }
        else {
            copyCode = (index) => `dict_write{dict_ptr=warp_memory}(${loc(index)}, calldata[${index}]);`;
        }
        const funcName = `cd_to_memory_static_array${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(calldata : ${callDataType}) -> (mem_loc: felt){
            alloc_locals;
            let (mem_start) = wm_alloc(${(0, utils_1.uint256)(memoryType.width)});
            ${(0, utils_2.mapRange)((0, utils_2.narrowBigIntSafe)(type.size), (n) => copyCode(n)).join('\n')}
            return (mem_start,);
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.WM_ALLOC),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.DICT_WRITE),
                ...funcCalls,
            ],
        };
    }
    createStructCopyFunction(type, structDef) {
        const calldataType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const memoryType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        const [copyCode, funcCalls] = structDef.vMembers.reduce(([copyCode, funcCalls, offset], decl) => {
            const type = (0, nodeTypeProcessing_1.safeGetNodeType)(decl, this.ast.inference);
            if ((0, nodeTypeProcessing_1.isReferenceType)(type)) {
                const recursiveFunc = this.getOrCreateFuncDef(type);
                const code = [
                    `let (member_${decl.name}) = ${recursiveFunc.name}(calldata.${decl.name});`,
                    `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', offset)}, member_${decl.name});`,
                ].join('\n');
                return [[...copyCode, code], [...funcCalls, recursiveFunc], offset + 1];
            }
            const memberWidth = cairoTypeSystem_1.CairoType.fromSol(type, this.ast).width;
            const code = memberWidth === 2
                ? [
                    `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', offset)}, calldata.${decl.name}.low);`,
                    `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', offset + 1)}, calldata.${decl.name}.high);`,
                ].join('\n')
                : `dict_write{dict_ptr=warp_memory}(${(0, base_1.add)('mem_start', offset)}, calldata.${decl.name});`;
            return [[...copyCode, code], funcCalls, offset + memberWidth];
        }, [new Array(), new Array(), 0]);
        const funcName = `cd_to_memory_struct_${structDef.name}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        #[implicit(warp_memory)]
        func ${funcName}(calldata : ${calldataType}) -> (mem_loc: felt){
            alloc_locals;
            let (mem_start) = wm_alloc(${(0, utils_1.uint256)(memoryType.width)});
            ${copyCode.join('\n')}
            return (mem_start,
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.DICT_WRITE),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.WM_ALLOC),
                ...funcCalls,
            ],
        };
    }
}
exports.CallDataToMemoryGen = CallDataToMemoryGen;
//# sourceMappingURL=calldataToMemory.js.map