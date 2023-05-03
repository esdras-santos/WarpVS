"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CairoUtilFuncGen = void 0;
const arrayLiteral_1 = require("./memory/arrayLiteral");
const memoryDynArrayLength_1 = require("./memory/memoryDynArrayLength");
const memoryMemberAccess_1 = require("./memory/memoryMemberAccess");
const memoryRead_1 = require("./memory/memoryRead");
const memoryStruct_1 = require("./memory/memoryStruct");
const memoryWrite_1 = require("./memory/memoryWrite");
const staticIndexAccess_1 = require("./memory/staticIndexAccess");
const dynArray_1 = require("./storage/dynArray");
const dynArrayIndexAccess_1 = require("./storage/dynArrayIndexAccess");
const dynArrayPop_1 = require("./storage/dynArrayPop");
const dynArrayPushWithArg_1 = require("./storage/dynArrayPushWithArg");
const dynArrayPushWithoutArg_1 = require("./storage/dynArrayPushWithoutArg");
const calldataToMemory_1 = require("./calldata/calldataToMemory");
const externalDynArrayStructConstructor_1 = require("./calldata/externalDynArray/externalDynArrayStructConstructor");
const implicitArrayConversion_1 = require("./calldata/implicitArrayConversion");
const mappingIndexAccess_1 = require("./storage/mappingIndexAccess");
const staticArrayIndexAccess_1 = require("./storage/staticArrayIndexAccess");
const storageDelete_1 = require("./storage/storageDelete");
const storageMemberAccess_1 = require("./storage/storageMemberAccess");
const storageRead_1 = require("./storage/storageRead");
const storageToMemory_1 = require("./storage/storageToMemory");
const storageWrite_1 = require("./storage/storageWrite");
const memoryToCalldata_1 = require("./memory/memoryToCalldata");
const memoryToStorage_1 = require("./memory/memoryToStorage");
const calldataToStorage_1 = require("./calldata/calldataToStorage");
const copyToStorage_1 = require("./storage/copyToStorage");
const storageToCalldata_1 = require("./storage/storageToCalldata");
const implicitConversion_1 = require("./memory/implicitConversion");
const arrayConcat_1 = require("./memory/arrayConcat");
const encodeToFelt_1 = require("./utils/encodeToFelt");
const abiEncode_1 = require("./abi/abiEncode");
const abiEncodePacked_1 = require("./abi/abiEncodePacked");
const abiEncodeWithSelector_1 = require("./abi/abiEncodeWithSelector");
const abiEncodeWithSignature_1 = require("./abi/abiEncodeWithSignature");
const abiDecode_1 = require("./abi/abiDecode");
const indexEncode_1 = require("./abi/indexEncode");
const event_1 = require("./event");
class CairoUtilFuncGen {
    constructor(ast, sourceUnit) {
        const dynArray = new dynArray_1.DynArrayGen(ast, sourceUnit);
        const memoryRead = new memoryRead_1.MemoryReadGen(ast, sourceUnit);
        const storageReadGen = new storageRead_1.StorageReadGen(ast, sourceUnit);
        const storageDelete = new storageDelete_1.StorageDeleteGen(dynArray, storageReadGen, ast, sourceUnit);
        const memoryToStorage = new memoryToStorage_1.MemoryToStorageGen(dynArray, memoryRead, storageDelete, ast, sourceUnit);
        const storageWrite = new storageWrite_1.StorageWriteGen(ast, sourceUnit);
        const storageToStorage = new copyToStorage_1.StorageToStorageGen(dynArray, storageDelete, ast, sourceUnit);
        const calldataToStorage = new calldataToStorage_1.CalldataToStorageGen(dynArray, storageWrite, ast, sourceUnit);
        const externalDynArrayStructConstructor = new externalDynArrayStructConstructor_1.ExternalDynArrayStructConstructor(ast, sourceUnit);
        const memoryWrite = new memoryWrite_1.MemoryWriteGen(ast, sourceUnit);
        const storageDynArrayIndexAccess = new dynArrayIndexAccess_1.DynArrayIndexAccessGen(dynArray, ast, sourceUnit);
        const callDataConvert = new implicitArrayConversion_1.ImplicitArrayConversion(storageWrite, dynArray, storageDynArrayIndexAccess, ast, sourceUnit);
        this.memory = {
            arrayLiteral: new arrayLiteral_1.MemoryArrayLiteralGen(ast, sourceUnit),
            concat: new arrayConcat_1.MemoryArrayConcat(ast, sourceUnit),
            convert: new implicitConversion_1.MemoryImplicitConversionGen(memoryWrite, memoryRead, ast, sourceUnit),
            dynArrayLength: new memoryDynArrayLength_1.MemoryDynArrayLengthGen(ast, sourceUnit),
            memberAccess: new memoryMemberAccess_1.MemoryMemberAccessGen(ast, sourceUnit),
            read: memoryRead,
            staticArrayIndexAccess: new staticIndexAccess_1.MemoryStaticArrayIndexAccessGen(ast, sourceUnit),
            struct: new memoryStruct_1.MemoryStructGen(ast, sourceUnit),
            toCallData: new memoryToCalldata_1.MemoryToCallDataGen(externalDynArrayStructConstructor, memoryRead, ast, sourceUnit),
            toStorage: memoryToStorage,
            write: memoryWrite,
        };
        this.storage = {
            delete: storageDelete,
            dynArray: dynArray,
            dynArrayIndexAccess: storageDynArrayIndexAccess,
            dynArrayPop: new dynArrayPop_1.DynArrayPopGen(dynArray, storageDelete, ast, sourceUnit),
            dynArrayPush: {
                withArg: new dynArrayPushWithArg_1.DynArrayPushWithArgGen(dynArray, storageWrite, memoryToStorage, storageToStorage, calldataToStorage, callDataConvert, ast, sourceUnit),
                withoutArg: new dynArrayPushWithoutArg_1.DynArrayPushWithoutArgGen(dynArray, ast, sourceUnit),
            },
            mappingIndexAccess: new mappingIndexAccess_1.MappingIndexAccessGen(dynArray, ast, sourceUnit),
            memberAccess: new storageMemberAccess_1.StorageMemberAccessGen(ast, sourceUnit),
            read: storageReadGen,
            staticArrayIndexAccess: new staticArrayIndexAccess_1.StorageStaticArrayIndexAccessGen(ast, sourceUnit),
            toCallData: new storageToCalldata_1.StorageToCalldataGen(dynArray, storageReadGen, externalDynArrayStructConstructor, ast, sourceUnit),
            toMemory: new storageToMemory_1.StorageToMemoryGen(dynArray, ast, sourceUnit),
            toStorage: storageToStorage,
            write: storageWrite,
        };
        this.calldata = {
            dynArrayStructConstructor: externalDynArrayStructConstructor,
            toMemory: new calldataToMemory_1.CallDataToMemoryGen(ast, sourceUnit),
            convert: callDataConvert,
            toStorage: calldataToStorage,
        };
        const abiEncode = new abiEncode_1.AbiEncode(memoryRead, ast, sourceUnit);
        this.abi = {
            decode: new abiDecode_1.AbiDecode(memoryWrite, ast, sourceUnit),
            encode: abiEncode,
            encodePacked: new abiEncodePacked_1.AbiEncodePacked(memoryRead, ast, sourceUnit),
            encodeWithSelector: new abiEncodeWithSelector_1.AbiEncodeWithSelector(abiEncode, ast, sourceUnit),
            encodeWithSignature: new abiEncodeWithSignature_1.AbiEncodeWithSignature(abiEncode, ast, sourceUnit),
        };
        const indexEncode = new indexEncode_1.IndexEncode(memoryRead, ast, sourceUnit);
        this.events = {
            index: indexEncode,
            event: new event_1.EventFunction(abiEncode, indexEncode, ast, sourceUnit),
        };
        this.utils = {
            encodeAsFelt: new encodeToFelt_1.EncodeAsFelt(externalDynArrayStructConstructor, ast, sourceUnit),
        };
    }
}
exports.CairoUtilFuncGen = CairoUtilFuncGen;
//# sourceMappingURL=index.js.map