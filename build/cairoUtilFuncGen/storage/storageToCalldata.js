"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageToCalldataGen = void 0;
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
class StorageToCalldataGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageReadGen, externalDynArrayStructConstructor, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageReadGen = storageReadGen;
        this.externalDynArrayStructConstructor = externalDynArrayStructConstructor;
    }
    gen(storageLocation) {
        const storageType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(storageLocation, this.ast.inference))[0];
        const funcDef = this.getOrCreateFuncDef(storageType);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [storageLocation], this.ast);
    }
    getOrCreateFuncDef(type) {
        const key = type.pp();
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(type);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.Storage]], [['obj', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.CallData]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type) {
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Copying ${(0, astPrinter_1.printTypeNode)(type)} from storage to calldata is not supported yet`);
        };
        return (0, base_1.delegateBasedOnType)(type, (type) => this.createDynamicArrayCopyFunction(type), (type) => this.createStaticArrayCopyFunction(type), (type) => this.createStructCopyFunction(type), unexpectedTypeFunc, unexpectedTypeFunc);
    }
    createStructCopyFunction(structType) {
        (0, assert_1.default)(structType.definition instanceof solc_typed_ast_1.StructDefinition);
        const structDef = structType.definition;
        const cairoStruct = cairoTypeSystem_1.CairoType.fromSol(structType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const structName = `struct_${cairoStruct.toString()}`;
        const [copyInstructions, members, funcsCalled] = this.generateStructCopyInstructions(structDef.vMembers.map((varDecl) => (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, this.ast.inference)), 'member');
        const funcName = `ws_struct_${cairoStruct.toString()}_to_calldata`;
        const code = (0, endent_1.default) `
      func ${funcName}(loc : felt) -> (${structName} : ${cairoStruct.toString()}){
        alloc_locals;
        ${copyInstructions.join('\n')}
        return (${cairoStruct.toString()}(${members.join(', ')}),);
      }
    `;
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: funcsCalled,
        };
        return funcInfo;
    }
    createStaticArrayCopyFunction(arrayType) {
        (0, assert_1.default)(arrayType.size !== undefined);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(arrayType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const [copyInstructions, members, funcsCalled] = this.generateStructCopyInstructions((0, utils_1.mapRange)((0, utils_1.narrowBigIntSafe)(arrayType.size), () => arrayType.elementT), 'elem');
        const funcName = `ws_static_array_to_calldata${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(loc : felt) -> (static_array : ${cairoType.toString()}){
        alloc_locals;
        ${copyInstructions.join('\n')}
        return ((${members.join(', ')}),);
      }
    `;
        return {
            name: funcName,
            code: code,
            functionsCalled: funcsCalled,
        };
    }
    createDynamicArrayCopyFunction(arrayType) {
        const elementT = (0, nodeTypeProcessing_1.getElementType)(arrayType);
        const structDef = cairoTypeSystem_1.CairoType.fromSol(arrayType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(structDef instanceof cairoTypeSystem_1.CairoDynArray);
        const storageReadFunc = this.storageReadGen.getOrCreateFuncDef(elementT);
        const structDynArray = this.externalDynArrayStructConstructor.getOrCreateFuncDef(arrayType);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementT);
        const arrayName = dynArray.name;
        const lenName = dynArrayLength.name;
        const cairoElementType = cairoTypeSystem_1.CairoType.fromSol(elementT, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const ptrType = `${cairoElementType.toString()}*`;
        const funcName = `ws_dynamic_array_to_calldata${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}_write(
         loc : felt,
         index : felt,
         len : felt,
         ptr : ${ptrType}) -> (ptr : ${ptrType}){
         alloc_locals;
         if (len == index){
             return (ptr,);
         }
         let (index_uint256) = warp_uint256(index);
         let (elem_loc) = ${arrayName}.read(loc, index_uint256); // elem_loc should never be zero
         let (elem) = ${storageReadFunc.name}(elem_loc);
         assert ptr[index] = elem;
         return ${funcName}_write(loc, index + 1, len, ptr);
      }
      func ${funcName}(loc : felt) -> (dyn_array_struct : ${structDef.name}){
         alloc_locals;
         let (len_uint256) = ${lenName}.read(loc);
         let len = len_uint256.low + len_uint256.high*128;
         let (ptr : ${ptrType}) = alloc();
         let (ptr : ${ptrType}) = ${funcName}_write(loc, 0, len, ptr);
         let dyn_array_struct = ${structDef.name}(len, ptr);
         return (dyn_array_struct,);
      }
    `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.WARP_UINT256),
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.ALLOC),
        ];
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: [
                ...importedFuncs,
                structDynArray,
                dynArray,
                dynArrayLength,
                storageReadFunc,
            ],
        };
        return funcInfo;
    }
    // TODO: static arrays functions are going to be huge with big size. We should build
    // a copy function for them instead of reusing structs
    generateStructCopyInstructions(varDeclarations, tempVarName) {
        const [members, copyInstructions, funcsCalled] = varDeclarations.reduce(([members, copyInstructions, funcsCalled, offset], varType, index) => {
            const varCairoTypeWidth = cairoTypeSystem_1.CairoType.fromSol(varType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).width;
            const readFunc = this.storageReadGen.getOrCreateFuncDef(varType);
            const location = (0, base_1.add)('loc', offset);
            const memberName = `${tempVarName}_${index}`;
            const instruction = `    let (${memberName}) = ${readFunc.name}(${location});`;
            return [
                [...members, memberName],
                [...copyInstructions, instruction],
                [...funcsCalled, readFunc],
                offset + varCairoTypeWidth,
            ];
        }, [new Array(), new Array(), new Array(), 0]);
        return [copyInstructions, members, funcsCalled];
    }
}
exports.StorageToCalldataGen = StorageToCalldataGen;
//# sourceMappingURL=storageToCalldata.js.map