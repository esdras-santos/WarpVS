import { AST } from '../ast/ast';
import { MemoryArrayLiteralGen } from './memory/arrayLiteral';
import { MemoryDynArrayLengthGen } from './memory/memoryDynArrayLength';
import { MemoryMemberAccessGen } from './memory/memoryMemberAccess';
import { MemoryReadGen } from './memory/memoryRead';
import { MemoryStructGen } from './memory/memoryStruct';
import { MemoryWriteGen } from './memory/memoryWrite';
import { MemoryStaticArrayIndexAccessGen } from './memory/staticIndexAccess';
import { DynArrayGen } from './storage/dynArray';
import { DynArrayIndexAccessGen } from './storage/dynArrayIndexAccess';
import { DynArrayPopGen } from './storage/dynArrayPop';
import { DynArrayPushWithArgGen } from './storage/dynArrayPushWithArg';
import { DynArrayPushWithoutArgGen } from './storage/dynArrayPushWithoutArg';
import { CallDataToMemoryGen } from './calldata/calldataToMemory';
import { ExternalDynArrayStructConstructor } from './calldata/externalDynArray/externalDynArrayStructConstructor';
import { ImplicitArrayConversion } from './calldata/implicitArrayConversion';
import { MappingIndexAccessGen } from './storage/mappingIndexAccess';
import { StorageStaticArrayIndexAccessGen } from './storage/staticArrayIndexAccess';
import { StorageDeleteGen } from './storage/storageDelete';
import { StorageMemberAccessGen } from './storage/storageMemberAccess';
import { StorageReadGen } from './storage/storageRead';
import { StorageToMemoryGen } from './storage/storageToMemory';
import { StorageWriteGen } from './storage/storageWrite';
import { MemoryToCallDataGen } from './memory/memoryToCalldata';
import { MemoryToStorageGen } from './memory/memoryToStorage';
import { CalldataToStorageGen } from './calldata/calldataToStorage';
import { StorageToStorageGen } from './storage/copyToStorage';
import { StorageToCalldataGen } from './storage/storageToCalldata';
import { SourceUnit } from 'solc-typed-ast';
import { MemoryImplicitConversionGen } from './memory/implicitConversion';
import { MemoryArrayConcat } from './memory/arrayConcat';
import { EncodeAsFelt } from './utils/encodeToFelt';
import { AbiEncode } from './abi/abiEncode';
import { AbiEncodePacked } from './abi/abiEncodePacked';
import { AbiEncodeWithSelector } from './abi/abiEncodeWithSelector';
import { AbiEncodeWithSignature } from './abi/abiEncodeWithSignature';
import { AbiDecode } from './abi/abiDecode';
import { IndexEncode } from './abi/indexEncode';
import { EventFunction } from './event';
export declare class CairoUtilFuncGen {
    abi: {
        decode: AbiDecode;
        encode: AbiEncode;
        encodePacked: AbiEncodePacked;
        encodeWithSelector: AbiEncodeWithSelector;
        encodeWithSignature: AbiEncodeWithSignature;
    };
    calldata: {
        dynArrayStructConstructor: ExternalDynArrayStructConstructor;
        toMemory: CallDataToMemoryGen;
        toStorage: CalldataToStorageGen;
        convert: ImplicitArrayConversion;
    };
    memory: {
        arrayLiteral: MemoryArrayLiteralGen;
        concat: MemoryArrayConcat;
        convert: MemoryImplicitConversionGen;
        dynArrayLength: MemoryDynArrayLengthGen;
        memberAccess: MemoryMemberAccessGen;
        read: MemoryReadGen;
        staticArrayIndexAccess: MemoryStaticArrayIndexAccessGen;
        struct: MemoryStructGen;
        toCallData: MemoryToCallDataGen;
        toStorage: MemoryToStorageGen;
        write: MemoryWriteGen;
    };
    storage: {
        delete: StorageDeleteGen;
        dynArray: DynArrayGen;
        dynArrayIndexAccess: DynArrayIndexAccessGen;
        dynArrayPop: DynArrayPopGen;
        dynArrayPush: {
            withArg: DynArrayPushWithArgGen;
            withoutArg: DynArrayPushWithoutArgGen;
        };
        mappingIndexAccess: MappingIndexAccessGen;
        memberAccess: StorageMemberAccessGen;
        read: StorageReadGen;
        staticArrayIndexAccess: StorageStaticArrayIndexAccessGen;
        toCallData: StorageToCalldataGen;
        toMemory: StorageToMemoryGen;
        toStorage: StorageToStorageGen;
        write: StorageWriteGen;
    };
    events: {
        index: IndexEncode;
        event: EventFunction;
    };
    utils: {
        encodeAsFelt: EncodeAsFelt;
    };
    constructor(ast: AST, sourceUnit: SourceUnit);
}
//# sourceMappingURL=index.d.ts.map