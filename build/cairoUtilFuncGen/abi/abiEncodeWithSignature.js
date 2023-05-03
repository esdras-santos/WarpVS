"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiEncodeWithSignature = void 0;
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const abiEncodeWithSelector_1 = require("./abiEncodeWithSelector");
class AbiEncodeWithSignature extends abiEncodeWithSelector_1.AbiEncodeWithSelector {
    constructor() {
        super(...arguments);
        this.functionName = 'abi_encode_with_signature';
    }
    gen(expressions, sourceUnit) {
        const exprTypes = expressions.map((expr) => (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(expr, this.ast.inference))[0]);
        const funcInfo = this.getOrCreate(exprTypes);
        const functionStub = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, exprTypes.map((exprT, index) => (0, nodeTypeProcessing_1.isValueType)(exprT)
            ? [`param${index}`, (0, utils_1.typeNameFromTypeNode)(exprT, this.ast)]
            : [`param${index}`, (0, utils_1.typeNameFromTypeNode)(exprT, this.ast), solc_typed_ast_1.DataLocation.Memory]), [['result', (0, nodeTemplates_1.createBytesTypeName)(this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, sourceUnit ?? this.sourceUnit);
        return (0, functionGeneration_1.createCallToFunction)(functionStub, expressions, this.ast);
    }
    getOrCreate(types) {
        const signature = types[0];
        if (!(signature instanceof solc_typed_ast_1.StringType)) {
            throw new errors_1.TranspileFailedError(`While encoding with selector expected first argument to be string but found ${(0, astPrinter_1.printTypeNode)(signature)} instead`);
        }
        types = types.slice(1);
        const [params, encodings, functionsCalled] = types.reduce(([params, encodings, functionsCalled], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            const [paramEncodings, paramFuncCalls] = this.abiEncode.generateEncodingCode(type, 'bytes_index', 'bytes_offset', '4', `param${index}`);
            encodings.push(paramEncodings);
            return [params, encodings, functionsCalled.concat(paramFuncCalls)];
        }, [
            [{ name: 'signature', type: 'felt' }],
            [
                (0, endent_1.default) `
            let (signature_hash) = warp_keccak(signature);
            let (byte0) = byte256_at_index(signature_hash, 0);
            let (byte1) = byte256_at_index(signature_hash, 1);
            let (byte2) = byte256_at_index(signature_hash, 2);
            let (byte3) = byte256_at_index(signature_hash, 3);
            assert bytes_array[bytes_index] = byte0;
            assert bytes_array[bytes_index + 1] = byte1;
            assert bytes_array[bytes_index + 2] = byte2;
            assert bytes_array[bytes_index + 3] = byte3;
            let bytes_index = bytes_index + 4;
          `,
            ],
            new Array(),
        ]);
        const initialOffset = types.reduce((pv, cv) => pv + BigInt((0, nodeTypeProcessing_1.getByteSize)(cv, this.ast.inference)), 4n);
        const cairoParams = params.map((p) => `${p.name} : ${p.type}`).join(', ');
        const funcName = `${this.functionName}${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}(${cairoParams}) -> (result_ptr : felt){
        alloc_locals;
        let bytes_index : felt = 0;
        let bytes_offset : felt = ${initialOffset};
        let (bytes_array : felt*) = alloc();
        ${encodings.join('\n')}
        let (max_length256) = felt_to_uint256(bytes_offset);
        let (mem_ptr) = wm_new(max_length256, ${(0, utils_2.uint256)(1)});
        felt_array_to_warp_memory_array(0, bytes_array, 0, mem_ptr, bytes_offset);
        return (mem_ptr,);
      }
      `;
        const importedFuncs = [
            this.requireImport(...importPaths_1.U128_FROM_FELT),
            this.requireImport(...importPaths_1.ALLOC),
            this.requireImport(...importPaths_1.FELT_TO_UINT256),
            this.requireImport(...importPaths_1.WM_NEW),
            this.requireImport(...importPaths_1.FELT_ARRAY_TO_WARP_MEMORY_ARRAY),
            this.requireImport(...importPaths_1.BYTE256_AT_INDEX),
            this.requireImport(...importPaths_1.WARP_KECCAK),
        ];
        const cairoFunc = {
            name: funcName,
            code: code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
        return cairoFunc;
    }
}
exports.AbiEncodeWithSignature = AbiEncodeWithSignature;
//# sourceMappingURL=abiEncodeWithSignature.js.map