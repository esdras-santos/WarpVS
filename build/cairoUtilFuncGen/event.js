"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventFunction = exports.BYTES_IN_FELT_PACKING = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../export");
const base_1 = require("./base");
const abi_1 = require("solc-typed-ast/dist/types/abi");
const importPaths_1 = require("../utils/importPaths");
const endent_1 = __importDefault(require("endent"));
exports.BYTES_IN_FELT_PACKING = 31;
const BIG_ENDIAN = 1; // 0 for little endian, used for packing of bytes (31 byte felts -> a 248 bit felt)
/**
 * Generates a cairo function that emits an event through a cairo syscall.
 * Then replace the emit statement with a call to the generated function.
 */
class EventFunction extends base_1.StringIndexedFuncGen {
    constructor(abiEncode, indexEcnode, ast, sourceUint) {
        super(ast, sourceUint);
        this.abiEncode = abiEncode;
        this.indexEncode = indexEcnode;
    }
    gen(node, refEventDef) {
        const argsTypes = node.vEventCall.vArguments.map((arg) => (0, solc_typed_ast_1.generalizeType)((0, export_1.safeGetNodeType)(arg, this.ast.inference))[0]);
        const funcDef = this.getOrCreateFuncDef(refEventDef, argsTypes);
        return (0, export_1.createCallToFunction)(funcDef, node.vEventCall.vArguments, this.ast);
    }
    getOrCreateFuncDef(eventDef, argsTypes) {
        const key = `${eventDef.name}_${this.ast.inference.signatureHash(eventDef, abi_1.ABIEncoderVersion.V2)}`;
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(eventDef);
        const funcDef = (0, export_1.createCairoGeneratedFunction)(funcInfo, argsTypes.map((argT, index) => (0, export_1.isValueType)(argT)
            ? [`param${index}`, (0, export_1.typeNameFromTypeNode)(argT, this.ast)]
            : [`param${index}`, (0, export_1.typeNameFromTypeNode)(argT, this.ast), solc_typed_ast_1.DataLocation.Memory]), [], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(node) {
        // Add the canonicalSignatureHash so that generated function names don't collide when overloaded
        const [params, keysInsertions, dataParams, dataParamTypes, requiredFuncs] = node.vParameters.vParameters.reduce(([params, keysInsertions, dataParams, dataParamTypes, requiredFuncs], param, index) => {
            const paramType = (0, solc_typed_ast_1.generalizeType)((0, export_1.safeGetNodeType)(param, this.ast.inference))[0];
            const cairoType = export_1.CairoType.fromSol(paramType, this.ast, export_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            if (param.indexed) {
                // An indexed parameter should go to the keys array
                if ((0, export_1.isValueType)(paramType)) {
                    // If the parameter is a value type, we can just add it to the keys array
                    // as it is, as we do regular abi encoding
                    const [code, calledFuncs] = this.generateSimpleEncodingCode([paramType], 'keys', [
                        `param${index}`,
                    ]);
                    keysInsertions.push(code);
                    requiredFuncs.push(...calledFuncs);
                }
                else {
                    // If the parameter is a reference type, we hash the with special encoding
                    // function: more at:
                    //   https://docs.soliditylang.org/en/v0.8.14/abi-spec.html#encoding-of-indexed-event-parameters
                    const [code, calledFuncs] = this.generateComplexEncodingCode([paramType], 'keys', [
                        `param${index}`,
                    ]);
                    keysInsertions.push(code);
                    requiredFuncs.push(...calledFuncs);
                }
            }
            else {
                // A non-indexed parameter should go to the data array
                dataParams.push(`param${index}`);
                dataParamTypes.push(paramType);
            }
            return [params, keysInsertions, dataParams, dataParamTypes, requiredFuncs];
        }, [
            new Array(),
            new Array(),
            new Array(),
            new Array(),
            new Array(),
        ]);
        const [dataInsertions, dataInsertionsCalls] = this.generateSimpleEncodingCode(dataParamTypes, 'data', dataParams);
        const cairoParams = params.map((p) => `${p.name} : ${p.type}`).join(', ');
        const topic = (0, export_1.warpEventSignatureHash256FromString)(this.ast.inference.signature(node, abi_1.ABIEncoderVersion.V2));
        const [anonymousCode, anonymousCalls] = this.generateAnonymizeCode(node.anonymous, topic, this.ast.inference.signature(node, abi_1.ABIEncoderVersion.V2));
        const suffix = `${node.name}_${this.ast.inference.signatureHash(node, abi_1.ABIEncoderVersion.V2)}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${export_1.EMIT_PREFIX}${suffix}(${cairoParams}){
        alloc_locals;
        // keys arrays
        let keys_len: felt = 0;
        let (keys: felt*) = alloc();
        //Insert topic
        ${anonymousCode}
        ${keysInsertions.join('\n')}
        // keys: pack 31 byte felts into a single 248 bit felt
        let (keys_len: felt, keys: felt*) = pack_bytes_felt(${exports.BYTES_IN_FELT_PACKING}, ${BIG_ENDIAN}, keys_len, keys);
        // data arrays
        let data_len: felt = 0;
        let (data: felt*) = alloc();
        ${dataInsertions}
        // data: pack 31 bytes felts into a single 248 bits felt
        let (data_len: felt, data: felt*) = pack_bytes_felt(${exports.BYTES_IN_FELT_PACKING}, ${BIG_ENDIAN}, data_len, data);
        emit_event(keys_len, keys, data_len, data);
        return ();
      }
    `;
        const funcInfo = {
            name: `${export_1.EMIT_PREFIX}${suffix}`,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.EMIT_EVENT),
                this.requireImport(...importPaths_1.ALLOC),
                this.requireImport(...importPaths_1.PACK_BYTES_FELT),
                this.requireImport(...importPaths_1.BITWISE_BUILTIN),
                ...requiredFuncs,
                ...dataInsertionsCalls,
                ...anonymousCalls,
            ],
        };
        return funcInfo;
    }
    generateAnonymizeCode(isAnonymous, topic, eventSig) {
        if (isAnonymous) {
            return [`// Event is anonymous, topic won't be added to keys`, []];
        }
        return [
            (0, endent_1.default) `
        let topic256: Uint256 = Uint256(${topic.low}, ${topic.high});// keccak of event signature: ${eventSig}
        let (keys_len: felt) = fixed_bytes256_to_felt_dynamic_array_spl(keys_len, keys, 0, topic256);
      `,
            [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.FELT_TO_UINT256),
                this.requireImport(...importPaths_1.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY_SPL),
            ],
        ];
    }
    generateSimpleEncodingCode(types, arrayName, argNames) {
        const abiFunc = this.abiEncode.getOrCreateFuncDef(types);
        this.requireImport(...importPaths_1.WM_TO_FELT_ARRAY);
        this.requireImport(...importPaths_1.FELT_ARRAY_CONCAT);
        return [
            (0, endent_1.default) `
        let (mem_encode: felt) = ${abiFunc.name}(${argNames.join(',')});
        let (encode_bytes_len: felt, encode_bytes: felt*) = wm_to_felt_array(mem_encode);
        let (${arrayName}_len: felt) = felt_array_concat(encode_bytes_len, 0, encode_bytes, ${arrayName}_len, ${arrayName});
      `,
            [this.requireImport(...importPaths_1.WM_TO_FELT_ARRAY), this.requireImport(...importPaths_1.FELT_ARRAY_CONCAT), abiFunc],
        ];
    }
    generateComplexEncodingCode(types, arrayName, argNames) {
        const abiFunc = this.indexEncode.getOrCreateFuncDef(types);
        return [
            (0, endent_1.default) `
          let (mem_encode: felt) = ${abiFunc.name}(${argNames.join(',')});
          let (keccak_hash256: Uint256) = warp_keccak(mem_encode);
          let (${arrayName}_len: felt) = fixed_bytes256_to_felt_dynamic_array_spl(${arrayName}_len, ${arrayName}, 0, keccak_hash256);
      `,
            [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.FELT_TO_UINT256),
                this.requireImport(...importPaths_1.WARP_KECCAK),
                this.requireImport(...importPaths_1.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY_SPL),
                abiFunc,
            ],
        ];
    }
}
exports.EventFunction = EventFunction;
//# sourceMappingURL=event.js.map