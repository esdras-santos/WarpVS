"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalldataToStorageGen = void 0;
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
const base_1 = require("../base");
class CalldataToStorageGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageWriteGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageWriteGen = storageWriteGen;
    }
    gen(storageLocation, calldataLocation) {
        const storageType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(storageLocation, this.ast.inference))[0];
        const calldataType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(calldataLocation, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(calldataType, storageType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [storageLocation, calldataLocation], this.ast);
    }
    getOrCreateFuncDef(calldataType, storageType) {
        const key = `calldataToStorage(${calldataType.pp()},${storageType.pp()})`;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(calldataType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', (0, utils_1.typeNameFromTypeNode)(storageType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['dynarray', (0, utils_1.typeNameFromTypeNode)(calldataType, this.ast), solc_typed_ast_1.DataLocation.CallData],
        ], [['loc', (0, utils_1.typeNameFromTypeNode)(storageType, this.ast), solc_typed_ast_1.DataLocation.Storage]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from calldata to storage is not supported yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type, def) => this.createStructCopyFunction(type, def), unexpectedTypeFunc, unexpectedTypeFunc);
    }
    createStructCopyFunction(structType, structDef) {
        const cairoStruct = cairoTypeSystem_1.CairoType.fromSol(structType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const structName = `struct_${structDef.name}`;
        const members = structDef.vMembers.map((varDecl) => `${structName}.${varDecl.name}`);
        const [copyInstructions, funcsCalled] = this.generateStructCopyInstructions(structDef.vMembers.map((varDecl) => (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, this.ast.inference)), members);
        const funcName = `cd_struct_${cairoStruct.toString()}_to_storage`;
        const code = (0, endent_1.default) `
      func ${funcName}(loc : felt, ${structName} : ${cairoStruct.toString()}) -> (loc : felt){
        alloc_locals;
        ${copyInstructions.join('\n')}
        return (loc,);
      }
      `;
        return { name: funcName, code: code, functionsCalled: funcsCalled };
    }
    // TODO: Check if function size can be reduced for big static arrays
    createStaticArrayCopyFunction(arrayType) {
        (0, assert_1.default)(arrayType.size !== undefined);
        const len = (0, utils_1.narrowBigIntSafe)(arrayType.size);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(arrayType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const elems = (0, utils_1.mapRange)(len, (n) => `static_array[${n}]`);
        const [copyInstructions, funcsCalled] = this.generateStructCopyInstructions((0, utils_1.mapRange)(len, () => arrayType.elementT), elems);
        const funcName = `cd_static_array_to_storage${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(loc : felt, static_array : ${cairoType.toString()}) -> (loc : felt){
        alloc_locals;
        ${copyInstructions.join('\n')}
        return (loc,);
      }
      `;
        return { name: funcName, code: code, functionsCalled: funcsCalled };
    }
    createDynamicArrayCopyFunction(arrayType) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(arrayType);
        const structDef = cairoTypeSystem_1.CairoType.fromSol(arrayType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(structDef instanceof cairoTypeSystem_1.CairoDynArray);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementT);
        const lenName = dynArrayLength.name;
        const cairoElementType = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const writeDef = this.storageWriteGen.getOrCreateFuncDef(elementT);
        const copyCode = `${writeDef.name}(elem_loc, elem[index]);`;
        const pointerType = `${cairoElementType.toString()}*`;
        const funcName = `cd_dynamic_array_to_storage${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}_write(loc : felt, index : felt, len : felt, elem: ${pointerType}){
         alloc_locals;
         if (index == len){
             return ();
         }
         let (index_uint256) = warp_uint256(index);
         let (elem_loc) = ${dynArray.name}.read(loc, index_uint256);
         if (elem_loc == 0){
             let (elem_loc) = WARP_USED_STORAGE.read();
             WARP_USED_STORAGE.write(elem_loc + ${cairoElementType.width});
             ${dynArray.name}.write(loc, index_uint256, elem_loc);
             ${copyCode}
             return ${funcName}_write(loc, index + 1, len, elem);
         }else{
             ${copyCode}
             return ${funcName}_write(loc, index + 1, len, elem);
         }
      }

      func ${funcName}(loc : felt, dyn_array_struct : ${structDef.name}) -> (loc : felt){ 
         alloc_locals;
         let (len_uint256) = warp_uint256(dyn_array_struct.len);
         ${lenName}.write(loc, len_uint256);
         ${funcName}_write(loc, 0, dyn_array_struct.len, dyn_array_struct.ptr);
         return (loc,);
      }
      `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [this.requireImport(...importPaths_1.WARP_UINT256), dynArray, dynArrayLength, writeDef],
        };
    }
    generateStructCopyInstructions(varTypes, names) {
        const [copyInstructions, funcCalls] = varTypes.reduce(([copyInstructions, funcCalls, offset], varType, index) => {
            const varCairoTypeWidth = cairoTypeSystem_1.CairoType.fromSol(varType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).width;
            const writeDef = this.storageWriteGen.getOrCreateFuncDef(varType);
            const location = (0, base_1.add)('loc', offset);
            return [
                [...copyInstructions, `    ${writeDef.name}(${location}, ${names[index]});`],
                [...funcCalls, writeDef],
                offset + varCairoTypeWidth,
            ];
        }, [new Array(), new Array(), 0]);
        return [copyInstructions, funcCalls];
    }
}
exports.CalldataToStorageGen = CalldataToStorageGen;
//# sourceMappingURL=calldataToStorage.js.map