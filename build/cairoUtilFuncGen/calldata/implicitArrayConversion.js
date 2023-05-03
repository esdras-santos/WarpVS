"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImplicitArrayConversion = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
const implicitConversion_1 = require("../memory/implicitConversion");
const errors_1 = require("../../utils/errors");
const astPrinter_1 = require("../../utils/astPrinter");
const importPaths_1 = require("../../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
// TODO: Add checks for expressions locations when generating
class ImplicitArrayConversion extends base_1.StringIndexedFuncGen {
    constructor(storageWriteGen, dynArrayGen, dynArrayIndexAccessGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.storageWriteGen = storageWriteGen;
        this.dynArrayGen = dynArrayGen;
        this.dynArrayIndexAccessGen = dynArrayIndexAccessGen;
    }
    genIfNecessary(targetExpression, sourceExpression) {
        const targetType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(targetExpression, this.ast.inference))[0];
        const sourceType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(sourceExpression, this.ast.inference))[0];
        if (checkDims(targetType, sourceType) || checkSizes(targetType, sourceType)) {
            return [this.gen(targetExpression, sourceExpression), true];
        }
        else {
            return [sourceExpression, false];
        }
    }
    gen(lhs, rhs) {
        const lhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(lhs, this.ast.inference);
        const rhsType = (0, nodeTypeProcessing_1.safeGetNodeType)(rhs, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(lhsType, rhsType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [(0, cloning_1.cloneASTNode)(lhs, this.ast), (0, cloning_1.cloneASTNode)(rhs, this.ast)], this.ast);
    }
    getOrCreateFuncDef(targetType, sourceType) {
        targetType = (0, solc_typed_ast_1.generalizeType)(targetType)[0];
        sourceType = (0, solc_typed_ast_1.generalizeType)(sourceType)[0];
        (0, assert_1.default)(targetType instanceof solc_typed_ast_1.ArrayType && sourceType instanceof solc_typed_ast_1.ArrayType, `Invalid calldata implicit conversion: Expected ArrayType type but found: ${(0, astPrinter_1.printTypeNode)(targetType)} and ${(0, astPrinter_1.printTypeNode)(sourceType)}`);
        const sourceRepForKey = cairoTypeSystem_1.CairoType.fromSol(sourceType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).fullStringRepresentation;
        // Even though the target is in Storage, a unique key is needed to set the function.
        // Using Calldata here gives us the full representation instead of WarpId provided by Storage.
        // This is only for KeyGen and no further processing.
        const targetRepForKey = cairoTypeSystem_1.CairoType.fromSol(targetType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).fullStringRepresentation;
        const targetBaseType = (0, implicitConversion_1.getBaseType)(targetType).pp();
        const sourceBaseType = (0, implicitConversion_1.getBaseType)(sourceType).pp();
        const key = `${targetRepForKey}_${targetBaseType} -> ${sourceRepForKey}_${sourceBaseType}`;
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(targetType, sourceType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['lhs', (0, utils_1.typeNameFromTypeNode)(targetType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['rhs', (0, utils_1.typeNameFromTypeNode)(sourceType, this.ast), solc_typed_ast_1.DataLocation.CallData],
        ], [], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(targetType, sourceType) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Scaling ${(0, astPrinter_1.printTypeNode)(sourceType)} to ${(0, astPrinter_1.printTypeNode)(targetType)} from memory to storage not implemented yet`);
        };
        return (0, base_1.delegateBasedOnType)(targetType, (targetType) => {
            (0, assert_1.default)(targetType instanceof solc_typed_ast_1.ArrayType && sourceType instanceof solc_typed_ast_1.ArrayType);
            return sourceType.size === undefined
                ? this.dynamicToDynamicArrayConversion(targetType, sourceType)
                : this.staticToDynamicArrayConversion(targetType, sourceType);
        }, (targetType) => {
            (0, assert_1.default)(sourceType instanceof solc_typed_ast_1.ArrayType);
            return this.staticToStaticArrayConversion(targetType, sourceType);
        }, unexpectedTypeFunc, unexpectedTypeFunc, unexpectedTypeFunc);
    }
    staticToStaticArrayConversion(targetType, sourceType) {
        (0, assert_1.default)(targetType.size !== undefined && sourceType.size !== undefined);
        (0, assert_1.default)(targetType.size >= sourceType.size, `Cannot convert a bigger static array (${targetType.size}) into a smaller one (${sourceType.size})`);
        const [generateCopyCode, requiredFunctions] = this.createStaticToStaticCopyCode(targetType, sourceType);
        const sourceSize = (0, utils_1.narrowBigIntSafe)(sourceType.size);
        const targetElementTSize = cairoTypeSystem_1.CairoType.fromSol(targetType.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const copyInstructions = (0, utils_1.mapRange)(sourceSize, (index) => generateCopyCode(index, index * targetElementTSize));
        const cairoSourceTypeName = cairoTypeSystem_1.CairoType.fromSol(sourceType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).toString();
        const funcName = `calldata_conversion_static_to_static${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(storage_loc: felt, arg: ${cairoSourceTypeName}){
      alloc_locals;
      ${copyInstructions.join('\n')}
          return ();
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: requiredFunctions,
        };
    }
    staticToDynamicArrayConversion(targetType, sourceType) {
        (0, assert_1.default)(targetType.size === undefined && sourceType.size !== undefined);
        const [generateCopyCode, requiredFunctions] = this.createStaticToDynamicCopyCode(targetType, sourceType);
        const sourceSize = (0, utils_1.narrowBigIntSafe)(sourceType.size);
        const copyInstructions = (0, utils_1.mapRange)(sourceSize, (index) => generateCopyCode(index));
        let optionalCode = '';
        let optionalImport = [];
        if ((0, nodeTypeProcessing_1.isDynamicArray)(targetType)) {
            const [_dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(targetType.elementT);
            optionalImport = [dynArrayLength];
            optionalCode = `${dynArrayLength.name}.write(ref, ${(0, utils_2.uint256)(sourceSize)});`;
        }
        const cairoSourceTypeName = cairoTypeSystem_1.CairoType.fromSol(sourceType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).toString();
        const funcName = `calldata_conversion_static_to_dynamic${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(ref: felt, arg: ${cairoSourceTypeName}){
          alloc_locals;
          ${optionalCode}
          ${copyInstructions}
          return ();
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                ...requiredFunctions,
                ...optionalImport,
            ],
        };
    }
    dynamicToDynamicArrayConversion(targetType, sourceType) {
        (0, assert_1.default)(targetType.size === undefined && sourceType.size === undefined);
        const [_dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(targetType.elementT);
        const arrayDef = this.dynArrayIndexAccessGen.getOrCreateFuncDef(targetType.elementT, targetType);
        const cairoSourceType = cairoTypeSystem_1.CairoType.fromSol(sourceType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const [copyInstructions, requiredFunctions] = this.createDynamicToDynamicCopyCode(targetType, sourceType);
        (0, assert_1.default)(cairoSourceType instanceof cairoTypeSystem_1.CairoDynArray);
        const funcName = `calldata_conversion_dynamic_to_dynamic${this.generatedFunctionsDef.size}`;
        const recursiveFuncName = `${funcName}_helper`;
        const code = (0, endent_1.default) `
      func ${recursiveFuncName}(ref: felt, len: felt, ptr: ${cairoSourceType.ptr_member.toString()}*, target_index: felt){
          alloc_locals;
          if (len == 0){
            return ();
          }
          let (storage_loc) = ${arrayDef.name}(ref, Uint256(target_index, 0));
          ${copyInstructions()}
          return ${recursiveFuncName}(ref, len - 1, ptr + ${cairoSourceType.ptr_member.width}, target_index+ 1 );
      }

      func ${funcName}(ref: felt, source: ${cairoSourceType.toString()}){
          alloc_locals;
          ${dynArrayLength.name}.write(ref, Uint256(source.len, 0));
          ${recursiveFuncName}(ref, source.len, source.ptr, 0);
          return ();
      }
    `;
        return { name: funcName, code: code, functionsCalled: [...requiredFunctions, dynArrayLength] };
    }
    createStaticToStaticCopyCode(targetType, sourceType) {
        const targetElementT = targetType.elementT;
        const sourceElementT = sourceType.elementT;
        if (targetElementT instanceof solc_typed_ast_1.IntType) {
            (0, assert_1.default)(sourceElementT instanceof solc_typed_ast_1.IntType);
            const writeToStorage = this.storageWriteGen.getOrCreateFuncDef(targetElementT);
            if (targetElementT.nBits === sourceElementT.nBits) {
                return [
                    (index, offset) => `${writeToStorage.name}(${(0, base_1.add)('storage_loc', offset)}, arg[${index}]);`,
                    [writeToStorage],
                ];
            }
            if (targetElementT.signed) {
                const convertionFunc = this.requireImport(importPaths_1.INT_CONVERSIONS, `warp_int${sourceElementT.nBits}_to_int${targetElementT.nBits}`);
                return [
                    (index, offset) => (0, endent_1.default) `
                let (arg_${index}) = ${convertionFunc.name}(arg[${index}]);
                ${writeToStorage.name}(${(0, base_1.add)('storage_loc', offset)}, arg_${index});
            `,
                    [writeToStorage, convertionFunc],
                ];
            }
            const toUintFunc = this.requireImport(...importPaths_1.FELT_TO_UINT256);
            return [
                (index, offset) => (0, endent_1.default) `
              let (arg_${index}) = ${toUintFunc.name}(arg[${index}]);
              ${writeToStorage.name}(${(0, base_1.add)('storage_loc', offset)}, arg_${index});
          `,
                [writeToStorage, toUintFunc],
            ];
        }
        if (targetElementT instanceof solc_typed_ast_1.FixedBytesType) {
            (0, assert_1.default)(sourceElementT instanceof solc_typed_ast_1.FixedBytesType);
            const writeToStorage = this.storageWriteGen.getOrCreateFuncDef(targetElementT);
            if (targetElementT.size > sourceElementT.size) {
                const widenFunc = this.requireImport(importPaths_1.BYTES_CONVERSIONS, `warp_bytes_widen${targetElementT.size === 32 ? '_256' : ''}`);
                return [
                    (index, offset) => (0, endent_1.default) `
                  let (arg_${index}) = ${widenFunc.name}(arg[${index}], ${(targetElementT.size - sourceElementT.size) * 8});
                  ${writeToStorage.name}(${(0, base_1.add)('storage_loc', offset)}, arg_${index});
            `,
                    [writeToStorage, widenFunc],
                ];
            }
            return [
                (index, offset) => `     ${writeToStorage.name}(${(0, base_1.add)('storage_loc', offset)}, arg[${index}]);`,
                [writeToStorage],
            ];
        }
        const auxFunc = this.getOrCreateFuncDef(targetElementT, sourceElementT);
        return [
            (0, nodeTypeProcessing_1.isDynamicArray)(targetElementT)
                ? (index, offset) => (0, endent_1.default) `
          let (ref_${index}) = readId(${(0, base_1.add)('storage_loc', offset)});
          ${auxFunc.name}(ref_${index}, arg[${index}]);
          `
                : (index, offset) => `    ${auxFunc.name}(${(0, base_1.add)('storage_loc', offset)}, arg[${index}]);`,
            [auxFunc],
        ];
    }
    createStaticToDynamicCopyCode(targetType, sourceType) {
        const targetElmType = targetType.elementT;
        const sourceElmType = sourceType.elementT;
        if (targetElmType instanceof solc_typed_ast_1.IntType) {
            (0, assert_1.default)(sourceElmType instanceof solc_typed_ast_1.IntType);
            const arrayDef = this.dynArrayIndexAccessGen.getOrCreateFuncDef(targetElmType, targetType);
            const writeDef = this.storageWriteGen.getOrCreateFuncDef(targetElmType);
            if (targetElmType.nBits === sourceElmType.nBits) {
                return [
                    (index) => (0, endent_1.default) `
              let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
              ${writeDef.name}(storage_loc${index}, arg[${index}]);
            `,
                    [arrayDef, writeDef],
                ];
            }
            if (targetElmType.signed) {
                const conversionFunc = this.requireImport(importPaths_1.INT_CONVERSIONS, `warp_int${sourceElmType.nBits}_to_int${targetElmType.nBits}`);
                return [
                    (index) => (0, endent_1.default) `
                let (arg_${index}) = ${conversionFunc.name}(arg[${index}]);
                let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
                ${writeDef.name}(storage_loc${index}, arg_${index});
            `,
                    [arrayDef, writeDef, conversionFunc],
                ];
            }
            const toUintFunc = this.requireImport(...importPaths_1.FELT_TO_UINT256);
            return [
                (index) => (0, endent_1.default) `
              let (arg_${index}) = ${toUintFunc.name}(arg[${index}]);
              let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
              ${writeDef.name}(storage_loc${index}, arg_${index});
          `,
                [arrayDef, writeDef, toUintFunc],
            ];
        }
        if (targetElmType instanceof solc_typed_ast_1.FixedBytesType) {
            (0, assert_1.default)(sourceElmType instanceof solc_typed_ast_1.FixedBytesType);
            const arrayDef = this.dynArrayIndexAccessGen.getOrCreateFuncDef(targetElmType, targetType);
            const writeDef = this.storageWriteGen.getOrCreateFuncDef(targetElmType);
            if (targetElmType.size > sourceElmType.size) {
                const widenFunc = this.requireImport(importPaths_1.BYTES_CONVERSIONS, `warp_bytes_widen${targetElmType.size === 32 ? '_256' : ''}`);
                const bits = (targetElmType.size - sourceElmType.size) * 8;
                return [
                    (index) => (0, endent_1.default) `
                let (arg_${index}) = ${widenFunc.name}(arg[${index}], ${bits});
                let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
                ${writeDef.name}(storage_loc${index}, arg_${index});
            `,
                    [arrayDef, writeDef, widenFunc],
                ];
            }
            return [
                (index) => (0, endent_1.default) `
              let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
              ${writeDef.name}(storage_loc${index}, arg[${index}]);
          `,
                [arrayDef, writeDef],
            ];
        }
        const sourceSize = sourceType.size;
        (0, assert_1.default)(sourceSize !== undefined);
        const arrayDef = this.dynArrayIndexAccessGen.getOrCreateFuncDef(targetElmType, targetType);
        const auxFunc = this.getOrCreateFuncDef(targetElmType, sourceElmType);
        const [_dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(targetElmType);
        if ((0, nodeTypeProcessing_1.isDynamicArray)(targetElmType)) {
            return [
                (index) => (0, endent_1.default) `
            let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
            let (ref_${index}) = readId(storage_loc${index});
            // TODO: Potential bug here: when array size is reduced, remaining elements must be
            // deleted. Investigate
            ${dynArrayLength.name}.write(ref_${index}, ${(0, utils_2.uint256)(sourceSize)});
            ${auxFunc.name}(ref_${index}, arg[${index}]);
          `,
                [arrayDef, auxFunc, dynArrayLength],
            ];
        }
        return [
            (index) => (0, endent_1.default) `
            let (storage_loc${index}) = ${arrayDef.name}(ref, ${(0, utils_2.uint256)(index)});
            ${auxFunc.name}(storage_loc${index}, arg[${index}]);
        `,
            [arrayDef, auxFunc],
        ];
    }
    createDynamicToDynamicCopyCode(targetType, sourceType) {
        const targetElmType = targetType.elementT;
        const sourceElmType = sourceType.elementT;
        const writeDef = this.storageWriteGen.getOrCreateFuncDef(targetElmType);
        if (targetElmType instanceof solc_typed_ast_1.IntType) {
            (0, assert_1.default)(sourceElmType instanceof solc_typed_ast_1.IntType);
            const conversionFunc = targetElmType.signed
                ? this.requireImport(importPaths_1.INT_CONVERSIONS, `warp_int${sourceElmType.nBits}_to_int${targetElmType.nBits}`)
                : this.requireImport(...importPaths_1.FELT_TO_UINT256);
            return [
                () => [
                    sourceElmType.signed
                        ? `    let (val) = ${conversionFunc.name}(ptr[0]);`
                        : `    let (val) = felt_to_uint256(ptr[0]);`,
                    `    ${writeDef.name}(storage_loc, val);`,
                ].join('\n'),
                [writeDef, conversionFunc],
            ];
        }
        if (targetElmType instanceof solc_typed_ast_1.FixedBytesType) {
            (0, assert_1.default)(sourceElmType instanceof solc_typed_ast_1.FixedBytesType);
            const widenFunc = this.requireImport(importPaths_1.BYTES_CONVERSIONS, `warp_bytes_widen${targetElmType.size === 32 ? '_256' : ''}`);
            const bits = (targetElmType.size - sourceElmType.size) * 8;
            return [
                () => (0, endent_1.default) `
            let (val) = ${widenFunc.name}(ptr[0], ${bits});
            ${writeDef.name}(storage_loc, val);
          `,
                [writeDef, widenFunc],
            ];
        }
        const auxFunc = this.getOrCreateFuncDef(targetElmType, sourceElmType);
        return [
            (0, nodeTypeProcessing_1.isDynamicArray)(targetElmType)
                ? () => (0, endent_1.default) `
            let (ref_name) = readId(storage_loc);
            ${auxFunc.name}(ref_name, ptr[0]);
          `
                : () => `${auxFunc.name}(storage_loc, ptr[0]);`,
            [auxFunc],
        ];
    }
}
exports.ImplicitArrayConversion = ImplicitArrayConversion;
function checkSizes(targetType, sourceType) {
    const targetBaseType = (0, implicitConversion_1.getBaseType)(targetType);
    const sourceBaseType = (0, implicitConversion_1.getBaseType)(sourceType);
    if (targetBaseType instanceof solc_typed_ast_1.IntType && sourceBaseType instanceof solc_typed_ast_1.IntType) {
        return ((targetBaseType.nBits > sourceBaseType.nBits && sourceBaseType.signed) ||
            (!targetBaseType.signed && targetBaseType.nBits === 256 && 256 > sourceBaseType.nBits));
    }
    if (targetBaseType instanceof solc_typed_ast_1.FixedBytesType && sourceBaseType instanceof solc_typed_ast_1.FixedBytesType) {
        return targetBaseType.size > sourceBaseType.size;
    }
    return false;
}
function checkDims(targetType, sourceType) {
    if (targetType instanceof solc_typed_ast_1.ArrayType && sourceType instanceof solc_typed_ast_1.ArrayType) {
        const targetArrayElm = targetType.elementT;
        const sourceArrayElm = sourceType.elementT;
        if (targetType.size !== undefined && sourceType.size !== undefined) {
            if (targetType.size > sourceType.size) {
                return true;
            }
            else if (targetArrayElm instanceof solc_typed_ast_1.ArrayType && sourceArrayElm instanceof solc_typed_ast_1.ArrayType) {
                return checkDims(targetArrayElm, sourceArrayElm);
            }
            else {
                return false;
            }
        }
        else if (targetType.size === undefined && sourceType.size !== undefined) {
            return true;
        }
        else if (targetType.size === undefined && sourceType.size === undefined)
            if (targetArrayElm instanceof solc_typed_ast_1.ArrayType && sourceArrayElm instanceof solc_typed_ast_1.ArrayType) {
                return checkDims(targetArrayElm, sourceArrayElm);
            }
    }
    return false;
}
//# sourceMappingURL=implicitArrayConversion.js.map