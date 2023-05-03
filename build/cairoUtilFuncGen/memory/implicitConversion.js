"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseType = exports.MemoryImplicitConversionGen = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
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
/*
  Class that converts arrays with smaller element types into bigger types
  e.g.
    uint8[] -> uint256[]
    uint8[3] -> uint256[]
    uint8[3] -> uint256[3]
    uint8[3] -> uint256[8]
  Only int/uint or fixed bytes implicit conversions
*/
class MemoryImplicitConversionGen extends base_1.StringIndexedFuncGen {
    constructor(memoryWrite, memoryRead, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.memoryWrite = memoryWrite;
        this.memoryRead = memoryRead;
    }
    genIfNecessary(sourceExpression, targetType) {
        const sourceType = (0, nodeTypeProcessing_1.safeGetNodeType)(sourceExpression, this.ast.inference);
        const generalTarget = (0, solc_typed_ast_1.generalizeType)(targetType)[0];
        const generalSource = (0, solc_typed_ast_1.generalizeType)(sourceType)[0];
        if (differentSizeArrays(generalTarget, generalSource)) {
            return [this.gen(sourceExpression, targetType), true];
        }
        const targetBaseType = getBaseType(targetType);
        const sourceBaseType = getBaseType(sourceType);
        // Cast Ints: intY[] -> intX[] with X > Y
        if (targetBaseType instanceof solc_typed_ast_1.IntType &&
            sourceBaseType instanceof solc_typed_ast_1.IntType &&
            targetBaseType.signed &&
            targetBaseType.nBits > sourceBaseType.nBits) {
            return [this.gen(sourceExpression, targetType), true];
        }
        if (targetBaseType instanceof solc_typed_ast_1.FixedBytesType &&
            sourceBaseType instanceof solc_typed_ast_1.FixedBytesType &&
            targetBaseType.size > sourceBaseType.size) {
            return [this.gen(sourceExpression, targetType), true];
        }
        const targetBaseCairoType = cairoTypeSystem_1.CairoType.fromSol(targetBaseType, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        const sourceBaseCairoType = cairoTypeSystem_1.CairoType.fromSol(sourceBaseType, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        // Casts anything with smaller memory space to a bigger one
        // Applies to uint only
        // (uintX[] -> uint256[])
        if (targetBaseCairoType.width > sourceBaseCairoType.width)
            return [this.gen(sourceExpression, targetType), true];
        return [sourceExpression, false];
    }
    gen(source, targetType) {
        const sourceType = (0, nodeTypeProcessing_1.safeGetNodeType)(source, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(targetType, sourceType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [source], this.ast);
    }
    getOrCreateFuncDef(targetType, sourceType) {
        const key = targetType.pp() + sourceType.pp();
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(targetType, sourceType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['source', (0, utils_1.typeNameFromTypeNode)(sourceType, this.ast), solc_typed_ast_1.DataLocation.Memory]], [['target', (0, utils_1.typeNameFromTypeNode)(targetType, this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(targetType, sourceType) {
        (0, assert_1.default)(targetType instanceof solc_typed_ast_1.PointerType && sourceType instanceof solc_typed_ast_1.PointerType);
        targetType = targetType.to;
        sourceType = sourceType.to;
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Scaling ${(0, astPrinter_1.printTypeNode)(sourceType)} to ${(0, astPrinter_1.printTypeNode)(targetType)} from memory to storage not implemented yet`);
        };
        const funcInfo = (0, base_1.delegateBasedOnType)(targetType, (targetType) => {
            (0, assert_1.default)(targetType instanceof solc_typed_ast_1.ArrayType && sourceType instanceof solc_typed_ast_1.ArrayType);
            return sourceType.size === undefined
                ? this.dynamicToDynamicArrayConversion(targetType, sourceType)
                : this.staticToDynamicArrayConversion(targetType, sourceType);
        }, (targetType) => {
            (0, assert_1.default)(sourceType instanceof solc_typed_ast_1.ArrayType);
            return this.staticToStaticArrayConversion(targetType, sourceType);
        }, unexpectedTypeFunc, unexpectedTypeFunc, unexpectedTypeFunc);
        return funcInfo;
    }
    staticToStaticArrayConversion(targetType, sourceType) {
        (0, assert_1.default)(targetType.size !== undefined &&
            sourceType.size !== undefined &&
            targetType.size >= sourceType.size);
        const [cairoTargetElementType, cairoSourceElementType] = typesToCairoTypes([targetType.elementT, sourceType.elementT], this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        const sourceLoc = `${getOffset('source', 'index', cairoSourceElementType.width)}`;
        let sourceLocationFunc;
        let sourceLocationCode;
        if (targetType.elementT instanceof solc_typed_ast_1.PointerType) {
            const idAllocSize = (0, nodeTypeProcessing_1.isDynamicArray)(sourceType.elementT) ? 2 : cairoSourceElementType.width;
            sourceLocationFunc = this.requireImport(...importPaths_1.WM_READ_ID);
            sourceLocationCode = `let (source_elem) = wm_read_id(${sourceLoc}, ${(0, utils_2.uint256)(idAllocSize)});`;
        }
        else {
            sourceLocationFunc = this.memoryRead.getOrCreateFuncDef(sourceType.elementT);
            sourceLocationCode = `let (source_elem) = ${sourceLocationFunc.name}(${sourceLoc});`;
        }
        const [conversionCode, calledFuncs] = this.generateScalingCode(targetType.elementT, sourceType.elementT);
        const memoryWriteDef = this.memoryWrite.getOrCreateFuncDef(targetType.elementT);
        const targetLoc = `${getOffset('target', 'index', cairoTargetElementType.width)}`;
        const targetCopyCode = `${memoryWriteDef.name}(${targetLoc}, target_elem);`;
        const allocSize = (0, utils_1.narrowBigIntSafe)(targetType.size) * cairoTargetElementType.width;
        const funcName = `memory_conversion_static_to_static${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}_copy(source : felt, target : felt, index : felt){
         alloc_locals;
         if (index == ${sourceType.size}){
             return ();
         }
         ${sourceLocationCode}
         ${conversionCode}
         ${targetCopyCode}
         return ${funcName}_copy(source, target, index + 1);
      }

      #[implicit(warp_memory)]
      func ${funcName}(source : felt) -> (target : felt){
         alloc_locals;
         let (target) = wm_alloc(${(0, utils_2.uint256)(allocSize)});
         ${funcName}_copy(source, target, 0);
         return(target,);
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.WM_ALLOC),
                sourceLocationFunc,
                ...calledFuncs,
                memoryWriteDef,
            ],
        };
    }
    staticToDynamicArrayConversion(targetType, sourceType) {
        (0, assert_1.default)(sourceType.size !== undefined);
        const [cairoTargetElementType, cairoSourceElementType] = typesToCairoTypes([targetType.elementT, sourceType.elementT], this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        const sourceTWidth = cairoSourceElementType.width;
        const targetTWidth = cairoTargetElementType.width;
        const memoryRead = this.memoryRead.getOrCreateFuncDef(sourceType.elementT);
        const sourceLocationCode = ['let felt_index = index.low + index.high * 128;'];
        if (sourceType.elementT instanceof solc_typed_ast_1.PointerType) {
            const idAllocSize = (0, nodeTypeProcessing_1.isDynamicArray)(sourceType.elementT) ? 2 : cairoSourceElementType.width;
            sourceLocationCode.push(`let (source_elem) = wm_read_id(${getOffset('source', 'felt_index', sourceTWidth)}, ${(0, utils_2.uint256)(idAllocSize)});`);
        }
        else {
            sourceLocationCode.push(`let (source_elem) = ${memoryRead.name}(${getOffset('source', 'felt_index', sourceTWidth)});`);
        }
        const [conversionCode, conversionFuncs] = this.generateScalingCode(targetType.elementT, sourceType.elementT);
        const memoryWrite = this.memoryWrite.getOrCreateFuncDef(targetType.elementT);
        const targetCopyCode = [
            `let (target_elem_loc) = wm_index_dyn(target, index, ${(0, utils_2.uint256)(targetTWidth)});`,
            `${memoryWrite.name}(target_elem_loc, target_elem);`,
        ];
        const funcName = `memory_conversion_static_to_dynamic${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}_copy(source : felt, target : felt, index : Uint256, len : Uint256){
        alloc_locals;
        if (len.low == index.low and len.high == index.high){
            return ();
        }
        ${sourceLocationCode.join('\n')}
        ${conversionCode}
        ${targetCopyCode.join('\n')}
        let (next_index, _) = uint256_add(index, ${(0, utils_2.uint256)(1)});
        return ${funcName}_copy(source, target, next_index, len);
      }
      #[implicit(warp_memory)]
      func ${funcName}(source : felt) -> (target : felt){
        alloc_locals;
        let len = ${(0, utils_2.uint256)(sourceType.size)};
        let (target) = wm_new(len, ${(0, utils_2.uint256)(targetTWidth)});
        ${funcName}_copy(source, target, Uint256(0, 0), len);
        return (target=target,);
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                this.requireImport(...importPaths_1.WM_INDEX_DYN),
                this.requireImport(...importPaths_1.WM_NEW),
                memoryRead,
                ...conversionFuncs,
                memoryWrite,
            ],
        };
    }
    dynamicToDynamicArrayConversion(targetType, sourceType) {
        const [cairoTargetElementType, cairoSourceElementType] = typesToCairoTypes([targetType.elementT, sourceType.elementT], this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
        const sourceTWidth = cairoSourceElementType.width;
        const targetTWidth = cairoTargetElementType.width;
        const sourceLocationCode = [
            `let (source_elem_loc) = wm_index_dyn(source, index, ${(0, utils_2.uint256)(sourceTWidth)});`,
        ];
        const memoryRead = this.memoryRead.getOrCreateFuncDef(sourceType.elementT);
        if (sourceType.elementT instanceof solc_typed_ast_1.PointerType) {
            const idAllocSize = (0, nodeTypeProcessing_1.isDynamicArray)(sourceType.elementT) ? 2 : cairoSourceElementType.width;
            sourceLocationCode.push(`let (source_elem) = wm_read_id(source_elem_loc, ${(0, utils_2.uint256)(idAllocSize)});`);
        }
        else {
            sourceLocationCode.push(`let (source_elem) = ${memoryRead.name}(source_elem_loc);`);
        }
        const [conversionCode, conversionCalls] = this.generateScalingCode(targetType.elementT, sourceType.elementT);
        const memoryWrite = this.memoryWrite.getOrCreateFuncDef(targetType.elementT);
        const targetCopyCode = [
            `let (target_elem_loc) = wm_index_dyn(target, index, ${(0, utils_2.uint256)(targetTWidth)});`,
            `${memoryWrite.name}(target_elem_loc, target_elem);`,
        ];
        const targetWidth = cairoTargetElementType.width;
        const funcName = `memory_conversion_dynamic_to_dynamic${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}_copy(source : felt, target : felt, index : Uint256, len : Uint256){
        alloc_locals;
        if (len.low == index.low and len.high == index.high){
          return ();
        }
        ${sourceLocationCode.join('\n')}
        ${conversionCode}
        ${targetCopyCode.join('\n')}
        let (next_index, _) = uint256_add(index, ${(0, utils_2.uint256)(1)});
        return ${funcName}_copy(source, target, next_index, len);
      }

      #[implicit(warp_memory)]
      func ${funcName}(source : felt) -> (target : felt){
        alloc_locals;
        let (len) = wm_dyn_array_length(source);
        let (target) = wm_new(len, ${(0, utils_2.uint256)(targetWidth)});
        ${funcName}_copy(source, target, Uint256(0, 0), len);
        return (target=target,);
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                this.requireImport(...importPaths_1.WM_INDEX_DYN),
                this.requireImport(...importPaths_1.WM_NEW),
                memoryRead,
                ...conversionCalls,
                memoryWrite,
            ],
        };
    }
    generateScalingCode(targetType, sourceType) {
        if (targetType instanceof solc_typed_ast_1.IntType) {
            (0, assert_1.default)(sourceType instanceof solc_typed_ast_1.IntType);
            return this.generateIntegerScalingCode(targetType, sourceType, 'target_elem', 'source_elem');
        }
        else if (targetType instanceof solc_typed_ast_1.FixedBytesType) {
            (0, assert_1.default)(sourceType instanceof solc_typed_ast_1.FixedBytesType);
            return this.generateFixedBytesScalingCode(targetType, sourceType, 'target_elem', 'source_elem');
        }
        else if (targetType instanceof solc_typed_ast_1.PointerType) {
            (0, assert_1.default)(sourceType instanceof solc_typed_ast_1.PointerType);
            const auxFunc = this.getOrCreateFuncDef(targetType, sourceType);
            return [`let (target_elem) = ${auxFunc.name}(source_elem);`, [auxFunc]];
        }
        else if (isNoScalableType(targetType)) {
            return [`let target_elem = source_elem;`, []];
        }
        else {
            throw new errors_1.TranspileFailedError(`Cannot scale ${(0, astPrinter_1.printTypeNode)(sourceType)} into ${(0, astPrinter_1.printTypeNode)(targetType)} from memory to storage`);
        }
    }
    generateIntegerScalingCode(targetType, sourceType, targetVar, sourceVar) {
        if (targetType.signed && targetType.nBits !== sourceType.nBits) {
            const conversionFunc = `warp_int${sourceType.nBits}_to_int${targetType.nBits}`;
            return [
                `let (${targetVar}) = ${conversionFunc}(${sourceVar});`,
                [this.requireImport(importPaths_1.INT_CONVERSIONS, conversionFunc)],
            ];
        }
        else if (!targetType.signed && targetType.nBits === 256 && sourceType.nBits < 256) {
            return [
                `let (${targetVar}) = felt_to_uint256(${sourceVar});`,
                [this.requireImport(...importPaths_1.FELT_TO_UINT256)],
            ];
        }
        else {
            return [`let ${targetVar} = ${sourceVar};`, []];
        }
    }
    generateFixedBytesScalingCode(targetType, sourceType, targetVar, sourceVar) {
        const widthDiff = targetType.size - sourceType.size;
        if (widthDiff === 0) {
            return [`let ${targetVar} = ${sourceVar};`, []];
        }
        const conversionFunc = targetType.size === 32 ? 'warp_bytes_widen_256' : 'warp_bytes_widen';
        return [
            `let (${targetVar}) = ${conversionFunc}(${sourceVar}, ${widthDiff * 8});`,
            [this.requireImport(importPaths_1.BYTES_CONVERSIONS, conversionFunc)],
        ];
    }
}
exports.MemoryImplicitConversionGen = MemoryImplicitConversionGen;
function getBaseType(type) {
    const dereferencedType = (0, solc_typed_ast_1.generalizeType)(type)[0];
    return dereferencedType instanceof solc_typed_ast_1.ArrayType
        ? getBaseType(dereferencedType.elementT)
        : dereferencedType;
}
exports.getBaseType = getBaseType;
function typesToCairoTypes(types, ast, conversionContext) {
    return types.map((t) => cairoTypeSystem_1.CairoType.fromSol(t, ast, conversionContext));
}
function getOffset(base, index, offset) {
    return offset === 0 ? base : offset === 1 ? `${base} + ${index}` : `${base} + ${index}*${offset}`;
}
function differentSizeArrays(targetType, sourceType) {
    if (!(targetType instanceof solc_typed_ast_1.ArrayType) || !(sourceType instanceof solc_typed_ast_1.ArrayType)) {
        return false;
    }
    if ((0, nodeTypeProcessing_1.isDynamicArray)(targetType) && (0, nodeTypeProcessing_1.isDynamicArray)(sourceType)) {
        return differentSizeArrays(targetType.elementT, sourceType.elementT);
    }
    if ((0, nodeTypeProcessing_1.isDynamicArray)(targetType)) {
        return true;
    }
    (0, assert_1.default)(targetType.size !== undefined && sourceType.size !== undefined);
    if (targetType.size > sourceType.size)
        return true;
    return differentSizeArrays(targetType.elementT, sourceType.elementT);
}
function isNoScalableType(type) {
    return (type instanceof solc_typed_ast_1.AddressType ||
        (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.EnumDefinition));
}
//# sourceMappingURL=implicitConversion.js.map