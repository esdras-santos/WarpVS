"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbiEncodeWithSelector = void 0;
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../warplib/utils");
const base_1 = require("./base");
class AbiEncodeWithSelector extends base_1.AbiBase {
    constructor(abiEncode, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.functionName = 'abi_encode_with_selector';
        this.abiEncode = abiEncode;
    }
    getOrCreate(types) {
        const selector = types[0];
        if (!(selector instanceof solc_typed_ast_1.FixedBytesType && selector.size === 4)) {
            throw new errors_1.TranspileFailedError(`While encoding with selector expected first argument to be bytes4 but found ${(0, astPrinter_1.printTypeNode)(selector)} instead`);
        }
        types = types.slice(1);
        const [params, encodings, functionsCalled] = types.reduce(([params, encodings, functionsCalled], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.Ref);
            params.push({ name: `param${index}`, type: cairoType.toString() });
            const [paramEncodings, paramFuncCalls] = this.abiEncode.generateEncodingCode(type, 'bytes_index', 'bytes_offset', '4', `param${index}`);
            encodings.push(paramEncodings);
            return [params, encodings, functionsCalled.concat(paramFuncCalls)];
        }, [
            [{ name: 'selector', type: 'felt' }],
            [
                (0, endent_1.default) `
            fixed_bytes_to_felt_dynamic_array(bytes_index, bytes_array, 0, selector, 4);
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
        let (mem_ptr) = wm_new(max_length256, ${(0, utils_1.uint256)(1)});
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
            this.requireImport(...importPaths_1.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY),
            this.requireImport(...importPaths_1.WARP_KECCAK),
        ];
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: [...importedFuncs, ...functionsCalled],
        };
        return funcInfo;
    }
}
exports.AbiEncodeWithSelector = AbiEncodeWithSelector;
//# sourceMappingURL=abiEncodeWithSelector.js.map