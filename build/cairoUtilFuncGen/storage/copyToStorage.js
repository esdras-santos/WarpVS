"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageToStorageGen = void 0;
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
  Generates functions to copy data from WARP_STORAGE to WARP_STORAGE
  The main point of care here is to copy dynamic arrays. Mappings and types containing them
  cannot be copied from storage to storage, and all types other than dynamic arrays can be
  copied by caring only about their width
*/
class StorageToStorageGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageDeleteGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageDeleteGen = storageDeleteGen;
    }
    gen(to, from) {
        const toType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(to, this.ast.inference))[0];
        const fromType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(from, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(toType, fromType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [to, from], this.ast);
    }
    getOrCreateFuncDef(toType, fromType) {
        const key = `${fromType.pp()}->${toType.pp()}`;
        const exisiting = this.generatedFunctionsDef.get(key);
        if (exisiting !== undefined) {
            return exisiting;
        }
        const funcInfo = this.getOrCreate(toType, fromType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['toLoc', (0, utils_1.typeNameFromTypeNode)(toType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['fromLoc', (0, utils_1.typeNameFromTypeNode)(fromType, this.ast), solc_typed_ast_1.DataLocation.Storage],
        ], [['retLoc', (0, utils_1.typeNameFromTypeNode)(toType, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit, { mutability: solc_typed_ast_1.FunctionStateMutability.View });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(toType, fromType) {
        const funcInfo = (0, base_1.delegateBasedOnType)(toType, (toType) => {
            (0, assert_1.default)(fromType instanceof solc_typed_ast_1.ArrayType ||
                fromType instanceof solc_typed_ast_1.BytesType ||
                fromType instanceof solc_typed_ast_1.StringType);
            if ((0, nodeTypeProcessing_1.getSize)(fromType) === undefined) {
                return this.createDynamicArrayCopyFunction(toType, fromType);
            }
            else {
                (0, assert_1.default)(fromType instanceof solc_typed_ast_1.ArrayType);
                return this.createStaticToDynamicArrayCopyFunction(toType, fromType);
            }
        }, (toType) => {
            (0, assert_1.default)(fromType instanceof solc_typed_ast_1.ArrayType);
            return this.createStaticArrayCopyFunction(toType, fromType);
        }, (_toType, def) => this.createStructCopyFunction(def), () => {
            throw new errors_1.TranspileFailedError('Attempted to create mapping clone function');
        }, (toType) => {
            if (toType instanceof solc_typed_ast_1.IntType) {
                (0, assert_1.default)(fromType instanceof solc_typed_ast_1.IntType);
                return this.createIntegerCopyFunction(toType, fromType);
            }
            else if (toType instanceof solc_typed_ast_1.FixedBytesType) {
                (0, assert_1.default)(fromType instanceof solc_typed_ast_1.FixedBytesType);
                return this.createFixedBytesCopyFunction(toType, fromType);
            }
            else {
                return this.createValueTypeCopyFunction(toType);
            }
        });
        return funcInfo;
    }
    createStructCopyFunction(def) {
        const members = def.vMembers.map((decl) => (0, nodeTypeProcessing_1.safeGetNodeType)(decl, this.ast.inference));
        const [copyCode, funcsCalled] = members.reduce(([copyCode, funcsCalled, offset], memberType) => {
            const width = cairoTypeSystem_1.CairoType.fromSol(memberType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
            if ((0, nodeTypeProcessing_1.isReferenceType)(memberType)) {
                const memberCopyFunc = this.getOrCreateFuncDef(memberType, memberType);
                const toLoc = (0, base_1.add)('to_loc', offset);
                const fromLoc = (0, base_1.add)('from_loc', offset);
                return [
                    [...copyCode, `${memberCopyFunc.name}(${toLoc}, ${fromLoc});`],
                    [...funcsCalled, memberCopyFunc],
                    offset + width,
                ];
            }
            return [
                [...copyCode, (0, utils_1.mapRange)(width, (index) => copyAtOffset(index + offset)).join('\n')],
                funcsCalled,
                offset + width,
            ];
        }, [new Array(), new Array(), 0]);
        const funcName = `WS_COPY_STRUCT_${def.name}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(to_loc: felt, from_loc: felt) -> (retLoc: felt){
            alloc_locals;
            ${copyCode.join('\n')}
            return (to_loc,);
        }
      `,
            functionsCalled: funcsCalled,
        };
    }
    createStaticArrayCopyFunction(toType, fromType) {
        (0, assert_1.default)(toType.size !== undefined, `Attempted to copy to storage dynamic array as static array in ${(0, astPrinter_1.printTypeNode)(fromType)}->${(0, astPrinter_1.printTypeNode)(toType)}`);
        (0, assert_1.default)(fromType.size !== undefined, `Attempted to copy from storage dynamic array as static array in ${(0, astPrinter_1.printTypeNode)(fromType)}->${(0, astPrinter_1.printTypeNode)(toType)}`);
        const elementCopyFunc = this.getOrCreateFuncDef(toType.elementT, fromType.elementT);
        const toElemType = cairoTypeSystem_1.CairoType.fromSol(toType.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const fromElemType = cairoTypeSystem_1.CairoType.fromSol(fromType.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const copyCode = createElementCopy(toElemType, fromElemType, elementCopyFunc.name);
        const fromSize = (0, utils_1.narrowBigIntSafe)(fromType.size);
        const toSize = (0, utils_1.narrowBigIntSafe)(toType.size);
        const funcName = `WS_COPY_STATIC_${this.generatedFunctionsDef.size}`;
        let optionalCalls;
        let stopRecursion;
        if (fromSize === toSize) {
            optionalCalls = [];
            stopRecursion = [`if (index == ${fromSize}){`, `return ();`, `}`];
        }
        else {
            const deleteFunc = this.storageDeleteGen.getOrCreateFuncDef(toType.elementT);
            optionalCalls = [deleteFunc, this.requireImport(...importPaths_1.IS_LE)];
            stopRecursion = [
                `if (index == ${toSize}){`,
                `    return ();`,
                `}`,
                `let lesser = is_le(index, ${fromSize - 1});`,
                `if (lesser == 0){`,
                `    ${deleteFunc.name}(to_elem_loc);`,
                `    return ${funcName}_elem(to_elem_loc + ${toElemType.width}, from_elem_loc, index + 1);`,
                `}`,
            ];
        }
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}_elem(to_elem_loc: felt, from_elem_loc: felt, index: felt) -> (){
        ${stopRecursion.join('\n')}
            ${copyCode('to_elem_loc', 'from_elem_loc')}
            return ${funcName}_elem(to_elem_loc + ${toElemType.width}, from_elem_loc + ${fromElemType.width}, index + 1)
        }

        func ${funcName}(to_elem_loc: felt, from_elem_loc: felt) -> (retLoc: felt){
            ${funcName}_elem(to_elem_loc, from_elem_loc, 0);
            return (to_elem_loc,);
        }
        `,
            functionsCalled: [elementCopyFunc, ...optionalCalls],
        };
    }
    createDynamicArrayCopyFunction(toType, fromType) {
        const fromElementT = (0, nodeTypeProcessing_1.getElementType)(fromType);
        const fromSize = (0, nodeTypeProcessing_1.getSize)(fromType);
        const toElementT = (0, nodeTypeProcessing_1.getElementType)(toType);
        const toSize = (0, nodeTypeProcessing_1.getSize)(toType);
        (0, assert_1.default)(toSize === undefined, 'Attempted to copy to storage static array as dynamic array');
        (0, assert_1.default)(fromSize === undefined, 'Attempted to copy from storage static array as dynamic array');
        const elementCopyFunc = this.getOrCreateFuncDef(toElementT, fromElementT);
        const fromElementCairoType = cairoTypeSystem_1.CairoType.fromSol(fromElementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const toElementCairoType = cairoTypeSystem_1.CairoType.fromSol(toElementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const [fromElementMapping, fromLengthMapping] = this.dynArrayGen.getOrCreateFuncDef(fromElementT);
        const fromElementMappingName = fromElementMapping.name;
        const fromLengthMappingName = fromLengthMapping.name;
        const [toElementMapping, toLengthMapping] = this.dynArrayGen.getOrCreateFuncDef(toElementT);
        const toElementMappingName = toElementMapping.name;
        const toLengthMappingName = toLengthMapping.name;
        const copyCode = createElementCopy(toElementCairoType, fromElementCairoType, elementCopyFunc.name);
        const deleteFunc = this.storageDeleteGen.getOrCreateFuncDef(toType);
        const deleteRemainingCode = `${deleteFunc.name}_elem(to_loc, from_length, to_length)`;
        const funcName = `WS_COPY_DYNAMIC_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}_elem(to_loc: felt, from_loc: felt, length: Uint256) -> (){
            alloc_locals;
            if (length.low == 0 and length.high == 0){
                return ();
            }
            let (index) = uint256_sub(length, Uint256(1,0));
            let (from_elem_loc) = ${fromElementMappingName}.read(from_loc, index);
            let (to_elem_loc) = ${toElementMappingName}.read(to_loc, index);
            if (to_elem_loc == 0){
                let (to_elem_loc) = WARP_USED_STORAGE.read();
                WARP_USED_STORAGE.write(to_elem_loc + ${toElementCairoType.width});
                ${toElementMappingName}.write(to_loc, index, to_elem_loc);
                ${copyCode('to_elem_loc', 'from_elem_loc')}
                return ${funcName}_elem(to_loc, from_loc, index);
            }else{
                ${copyCode('to_elem_loc', 'from_elem_loc')}
                return ${funcName}_elem(to_loc, from_loc, index);
            }
        }

        func ${funcName}(to_loc: felt, from_loc: felt) -> (retLoc: felt){
            alloc_locals;
            let (from_length) = ${fromLengthMappingName}.read(from_loc);
            let (to_length) = ${toLengthMappingName}.read(to_loc);
            ${toLengthMappingName}.write(to_loc, from_length);
            ${funcName}_elem(to_loc, from_loc, from_length);
            let (lesser) = uint256_lt(from_length, to_length);
            if (lesser == 1){
               ${deleteRemainingCode};
               return (to_loc,);
            }else{
               return (to_loc,);
            }
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_SUB),
                this.requireImport(...importPaths_1.UINT256_LT),
                elementCopyFunc,
                fromElementMapping,
                fromLengthMapping,
                toElementMapping,
                toLengthMapping,
                deleteFunc,
            ],
        };
    }
    createStaticToDynamicArrayCopyFunction(toType, fromType) {
        const toSize = (0, nodeTypeProcessing_1.getSize)(toType);
        const toElementT = (0, nodeTypeProcessing_1.getElementType)(toType);
        (0, assert_1.default)(fromType.size !== undefined);
        (0, assert_1.default)(toSize === undefined);
        const elementCopyFunc = this.getOrCreateFuncDef(toElementT, fromType.elementT);
        const fromElementCairoType = cairoTypeSystem_1.CairoType.fromSol(fromType.elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const toElementCairoType = cairoTypeSystem_1.CairoType.fromSol(toElementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const [toElementMapping, toLengthMapping] = this.dynArrayGen.getOrCreateFuncDef(toElementT);
        const toElementMappingName = toElementMapping.name;
        const toLengthMappingName = toLengthMapping.name;
        const copyCode = createElementCopy(toElementCairoType, fromElementCairoType, elementCopyFunc.name);
        const deleteFunc = this.storageDeleteGen.getOrCreateFuncDef(toType);
        const deleteRemainingCode = `${deleteFunc.name}_elem(to_loc, from_length, to_length)`;
        const funcName = `WS_COPY_STATIC_TO_DYNAMIC_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}_elem(to_loc: felt, from_elem_loc: felt, length: Uint256, index: Uint256) -> (){
            alloc_locals;
            if (length.low == index.low){
                if (length.high == index.high){
                    return ();
                }
            }
            let (to_elem_loc) = ${toElementMappingName}.read(to_loc, index);
            let (next_index, carry) = uint256_add(index, Uint256(1,0));
            assert carry = 0;
            if (to_elem_loc == 0){
                let (to_elem_loc) = WARP_USED_STORAGE.read();
                WARP_USED_STORAGE.write(to_elem_loc + ${toElementCairoType.width});
                ${toElementMappingName}.write(to_loc, index, to_elem_loc);
                ${copyCode('to_elem_loc', 'from_elem_loc')}
                return ${funcName}_elem(to_loc, from_elem_loc + ${fromElementCairoType.width}, length, next_index);
            }else{
                ${copyCode('to_elem_loc', 'from_elem_loc')}
                return ${funcName}_elem(to_loc, from_elem_loc + ${fromElementCairoType.width}, length, next_index);
            }
        }

        func ${funcName}(to_loc: felt, from_loc: felt) -> (retLoc: felt){
            alloc_locals;
            let from_length  = ${(0, utils_2.uint256)((0, utils_1.narrowBigIntSafe)(fromType.size))};
            let (to_length) = ${toLengthMappingName}.read(to_loc);
            ${toLengthMappingName}.write(to_loc, from_length);
            ${funcName}_elem(to_loc, from_loc, from_length , Uint256(0,0));
            let (lesser) = uint256_lt(from_length, to_length);
            if (lesser == 1){
               ${deleteRemainingCode};
               return (to_loc,);
            }else{
               return (to_loc,);
            }
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                this.requireImport(...importPaths_1.UINT256_LT),
                elementCopyFunc,
                toElementMapping,
                toLengthMapping,
                deleteFunc,
            ],
        };
    }
    createIntegerCopyFunction(toType, fromType) {
        (0, assert_1.default)(fromType.nBits <= toType.nBits, `Attempted to scale integer ${fromType.nBits} to ${toType.nBits}`);
        // Read changes depending if From is 256 bits or less
        const readFromCode = fromType.nBits === 256
            ? (0, endent_1.default) `
            let (from_low) = WARP_STORAGE.read(from_loc);
            let (from_high) = WARP_STORAGE.read(from_loc + 1);
            tempvar from_elem = Uint256(from_low, from_high);
          `
            : 'let (from_elem) = WARP_STORAGE.read(from_loc);';
        // Scaling for ints is different than for uints
        // Also memory represenation only change when To is 256 bits
        // and From is lesser than 256 bits
        const scalingCode = toType.signed
            ? `let (to_elem) = warp_int${fromType.nBits}_to_int${toType.nBits}(from_elem);`
            : toType.nBits === 256 && fromType.nBits < 256
                ? 'let (to_elem) = felt_to_uint256(from_elem);'
                : `let to_elem = from_elem;`;
        // Copy changes depending if To is 256 bits or less
        const copyToCode = toType.nBits === 256
            ? (0, endent_1.default) `
            WARP_STORAGE.write(to_loc, to_elem.low);
            WARP_STORAGE.write(to_loc + 1, to_elem.high);
          `
            : 'WARP_STORAGE.write(to_loc, to_elem);';
        const funcName = `WS_COPY_INTEGER_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(to_loc : felt, from_loc : felt) -> (ret_loc : felt){
           alloc_locals;
           ${readFromCode}
           ${scalingCode}
           ${copyToCode}
           return (to_loc,);
        }
        `,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                toType.signed
                    ? this.requireImport(importPaths_1.INT_CONVERSIONS, `warp_int${fromType.nBits}_to_int${toType.nBits}`)
                    : this.requireImport(...importPaths_1.FELT_TO_UINT256),
            ],
        };
    }
    createFixedBytesCopyFunction(toType, fromType) {
        const bitWidthDiff = (toType.size - fromType.size) * 8;
        (0, assert_1.default)(bitWidthDiff >= 0, `Attempted to scale fixed byte ${fromType.size} to ${toType.size}`);
        const conversionFunc = toType.size === 32 ? 'warp_bytes_widen_256' : 'warp_bytes_widen';
        const readFromCode = fromType.size === 32
            ? (0, endent_1.default) `
            let (from_low) = WARP_STORAGE.read(from_loc);
            let (from_high) = WARP_STORAGE.read(from_loc + 1);
            tempvar from_elem = Uint256(from_low, from_high);
          `
            : 'let (from_elem) = WARP_STORAGE.read(from_loc);';
        const scalingCode = bitWidthDiff !== 0
            ? `let (to_elem) = ${conversionFunc}(from_elem, ${bitWidthDiff});`
            : 'let to_elem = from_elem;';
        const copyToCode = toType.size === 32
            ? (0, endent_1.default) `
            WARP_STORAGE.write(to_loc, to_elem.low);
            WARP_STORAGE.write(to_loc + 1, to_elem.high);
          `
            : 'WARP_STORAGE.write(to_loc, to_elem);';
        const funcName = `WS_COPY_FIXED_BYTES_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(to_loc : felt, from_loc : felt) -> (ret_loc : felt){
           alloc_locals;
           ${readFromCode}
           ${scalingCode}
           ${copyToCode}
           return (to_loc,);
        }
      `,
            functionsCalled: [
                this.requireImport(importPaths_1.BYTES_CONVERSIONS, conversionFunc),
                this.requireImport(...importPaths_1.U128_FROM_FELT),
            ],
        };
    }
    createValueTypeCopyFunction(type) {
        const width = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation).width;
        const funcName = `WS_COPY_VALUE_${this.generatedFunctionsDef.size}`;
        return {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(to_loc : felt, from_loc : felt) -> (ret_loc : felt){
            alloc_locals;
            ${(0, utils_1.mapRange)(width, copyAtOffset).join('\n')}
            return (to_loc,);
        }
      `,
            functionsCalled: [],
        };
    }
}
exports.StorageToStorageGen = StorageToStorageGen;
function copyAtOffset(n) {
    return (0, endent_1.default) `
    let (copy) = WARP_STORAGE.read(${(0, base_1.add)('from_loc', n)});
    WARP_STORAGE.write(${(0, base_1.add)('to_loc', n)}, copy);
  `;
}
// TODO: There is a bunch of `readId` here!
// Do they need to be imported
function createElementCopy(toElementCairoType, fromElementCairoType, elementCopyFunc) {
    if (fromElementCairoType instanceof cairoTypeSystem_1.WarpLocation) {
        if (toElementCairoType instanceof cairoTypeSystem_1.WarpLocation) {
            return (to, from) => (0, endent_1.default) `
          let (from_elem_id) = readId(${from});
          let (to_elem_id) = readId(${to});
          ${elementCopyFunc}(to_elem_id, from_elem_id);
        `;
        }
        else {
            return (to, from) => (0, endent_1.default) `
          let (from_elem_id) = readId(${from});
          ${elementCopyFunc}(${to}, from_elem_id);
        `;
        }
    }
    else {
        if (toElementCairoType instanceof cairoTypeSystem_1.WarpLocation) {
            return (to, from) => (0, endent_1.default) `
          let (to_elem_id) = readId(${to});
          ${elementCopyFunc}(to_elem_id, ${from});
        `;
        }
        else {
            return (to, from) => `${elementCopyFunc}(${to}, ${from});`;
        }
    }
}
//# sourceMappingURL=copyToStorage.js.map