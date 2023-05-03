"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayPushWithArgGen = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const functionGeneration_1 = require("../../utils/functionGeneration");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const importPaths_1 = require("../../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
class DynArrayPushWithArgGen extends base_1.StringIndexedFuncGen {
    constructor(dynArrayGen, storageWrite, memoryToStorage, storageToStorage, calldataToStorage, calldataToStorageConversion, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.dynArrayGen = dynArrayGen;
        this.storageWrite = storageWrite;
        this.memoryToStorage = memoryToStorage;
        this.storageToStorage = storageToStorage;
        this.calldataToStorage = calldataToStorage;
        this.calldataToStorageConversion = calldataToStorageConversion;
    }
    gen(push) {
        (0, assert_1.default)(push.vExpression instanceof solc_typed_ast_1.MemberAccess);
        const arrayType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(push.vExpression.vExpression, this.ast.inference))[0];
        (0, assert_1.default)(arrayType instanceof solc_typed_ast_1.ArrayType ||
            arrayType instanceof solc_typed_ast_1.BytesType ||
            arrayType instanceof solc_typed_ast_1.StringType);
        (0, assert_1.default)(push.vArguments.length > 0, `Attempted to treat push without argument as push with argument`);
        const [argType, argLoc] = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(push.vArguments[0], this.ast.inference));
        const funcDef = this.getOrCreateFuncDef(arrayType, argType, argLoc);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [push.vExpression.vExpression, push.vArguments[0]], this.ast);
    }
    getOrCreateFuncDef(arrayType, argType, argLoc) {
        const key = `dynArrayPushWithArg(${arrayType.pp()},${argType.pp()},${argLoc})`;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate((0, nodeTypeProcessing_1.getElementType)(arrayType), argType, argLoc ?? solc_typed_ast_1.DataLocation.Default);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', (0, utils_1.typeNameFromTypeNode)(arrayType, this.ast), solc_typed_ast_1.DataLocation.Storage],
            ['value', (0, utils_1.typeNameFromTypeNode)(argType, this.ast), argLoc ?? solc_typed_ast_1.DataLocation.Default],
        ], [], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(elementType, argType, argLoc) {
        let elementWriteDef;
        let inputType;
        if (argLoc === solc_typed_ast_1.DataLocation.Memory) {
            elementWriteDef = this.memoryToStorage.getOrCreateFuncDef(elementType);
            inputType = 'felt';
        }
        else if (argLoc === solc_typed_ast_1.DataLocation.Storage) {
            elementWriteDef = this.storageToStorage.getOrCreateFuncDef(elementType, argType);
            inputType = 'felt';
        }
        else if (argLoc === solc_typed_ast_1.DataLocation.CallData) {
            if (elementType.pp() !== argType.pp()) {
                elementWriteDef = this.calldataToStorageConversion.getOrCreateFuncDef((0, nodeTypeProcessing_1.specializeType)(elementType, solc_typed_ast_1.DataLocation.Storage), (0, nodeTypeProcessing_1.specializeType)(argType, solc_typed_ast_1.DataLocation.CallData));
            }
            else {
                elementWriteDef = this.calldataToStorage.getOrCreateFuncDef(elementType, argType);
            }
            inputType = cairoTypeSystem_1.CairoType.fromSol(argType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef).toString();
        }
        else {
            elementWriteDef = this.storageWrite.getOrCreateFuncDef(elementType);
            inputType = cairoTypeSystem_1.CairoType.fromSol(elementType, this.ast).toString();
        }
        const allocationCairoType = cairoTypeSystem_1.CairoType.fromSol(elementType, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const [dynArray, dynArrayLength] = this.dynArrayGen.getOrCreateFuncDef(elementType);
        const arrayName = dynArray.name;
        const lengthName = dynArrayLength.name;
        const funcName = `${arrayName}_PUSHV${this.generatedFunctionsDef.size}`;
        const implicit = argLoc === solc_typed_ast_1.DataLocation.Memory ? '#[implicit(warp_memory)]' : '';
        const callWriteFunc = (cairoVar) => (0, nodeTypeProcessing_1.isDynamicArray)(argType) || argType instanceof solc_typed_ast_1.MappingType
            ? [`let (elem_id) = readId(${cairoVar});`, `${elementWriteDef.name}(elem_id, value);`]
            : [`${elementWriteDef.name}(${cairoVar}, value);`];
        return {
            name: funcName,
            code: (0, endent_1.default) `
        ${implicit}
        func ${funcName}(loc: felt, value: ${inputType}) -> (){
            alloc_locals;
            let (len) = ${lengthName}.read(loc);
            let (newLen, carry) = uint256_add(len, Uint256(1,0));
            assert carry = 0;
            ${lengthName}.write(loc, newLen);
            let (existing) = ${arrayName}.read(loc, len);
            if (existing == 0){
                let (used) = WARP_USED_STORAGE.read();
                WARP_USED_STORAGE.write(used + ${allocationCairoType.width});
                ${arrayName}.write(loc, len, used);
                ${callWriteFunc('used').join('\n')}
            }else{
                ${callWriteFunc('existing').join('\n')}
            }
            return ();
        }
      `,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.UINT256_ADD),
                elementWriteDef,
                dynArray,
                dynArrayLength,
            ],
        };
    }
}
exports.DynArrayPushWithArgGen = DynArrayPushWithArgGen;
//# sourceMappingURL=dynArrayPushWithArg.js.map