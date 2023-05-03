"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryArrayConcat = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const utils_2 = require("../../warplib/utils");
const base_1 = require("../base");
class MemoryArrayConcat extends base_1.StringIndexedFuncGen {
    gen(concat) {
        const argTypes = concat.vArguments.map((expr) => (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(expr, this.ast.inference))[0]);
        const funcDef = this.getOrCreateFuncDef(argTypes);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, concat.vArguments, this.ast);
    }
    getOrCreateFuncDef(argTypes) {
        // TODO: Check for hex"" and unicode"" which are treated as bytes instead of strings?!
        const validArgs = argTypes.every((type) => type instanceof solc_typed_ast_1.BytesType || type instanceof solc_typed_ast_1.FixedBytesType || solc_typed_ast_1.StringType);
        (0, assert_1.default)(validArgs, `Concat arguments must be all of string, bytes or fixed bytes type. Instead of: ${argTypes.map((t) => (0, astPrinter_1.printTypeNode)(t))}`);
        const key = argTypes
            // TODO: Wouldn't type.pp() work here?
            .map((type) => {
            if ((0, solc_typed_ast_1.isReferenceType)(type))
                return 'A';
            return `B${(0, utils_2.getIntOrFixedByteBitWidth)(type)}`;
        })
            .join('');
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const inputs = argTypes.map((arg, index) => [
            `arg_${index}`,
            (0, utils_1.typeNameFromTypeNode)(arg, this.ast),
            solc_typed_ast_1.DataLocation.Memory,
        ]);
        const outputTypeName = argTypes.some((t) => t instanceof solc_typed_ast_1.StringType)
            ? (0, export_1.createStringTypeName)(this.ast)
            : (0, export_1.createBytesTypeName)(this.ast);
        const output = ['res_loc', outputTypeName, solc_typed_ast_1.DataLocation.Memory];
        const funcInfo = this.getOrCreate(argTypes);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, inputs, [output], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(argTypes) {
        const funcInfo = this.generateBytesConcat(argTypes);
        return funcInfo;
    }
    generateBytesConcat(argTypes) {
        const argAmount = argTypes.length;
        const funcName = `concat${this.generatedFunctionsDef.size}_${argAmount}`;
        if (argAmount === 0) {
            return {
                name: funcName,
                code: (0, endent_1.default) `
          #[implicit(warp_memory)]
          func ${funcName}() -> (res_loc : felt){
             alloc_locals;
             let (res_loc) = wm_new(${(0, utils_2.uint256)(0)}, ${(0, utils_2.uint256)(1)});
             return (res_loc,);
          }
        `,
                functionsCalled: [this.requireImport(...importPaths_1.U128_FROM_FELT), this.requireImport(...importPaths_1.WM_NEW)],
            };
        }
        const cairoArgs = argTypes.map((type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast).toString();
            return `arg_${index} : ${cairoType}`;
        });
        const [argSizes, argSizesImports] = argTypes
            .map((t, n) => this.getSize(t, n))
            .reduce(([argSizes, argSizesImports], [sizeCode, sizeImport]) => {
            return [`${argSizes}\n${sizeCode}`, [...argSizesImports, ...sizeImport]];
        });
        const [concatCode, concatImports] = argTypes.reduce(([concatCode, concatImports], argType, index) => {
            const [copyCode, copyImport] = this.getCopyFunctionCall(argType, index);
            const fullCopyCode = [
                `let end_loc = start_loc + size_${index};`,
                copyCode,
                `let start_loc = end_loc;`,
            ];
            return [
                [
                    ...concatCode,
                    index < argTypes.length - 1
                        ? fullCopyCode.join('\n')
                        : fullCopyCode.slice(0, -1).join('\n'),
                ],
                [...concatImports, copyImport],
            ];
        }, [new Array(), new Array()]);
        const code = (0, endent_1.default) `
      #[implicit(warp_memory)]
      func ${funcName}(${cairoArgs}) -> (res_loc : felt){
          alloc_locals;
          // Get all sizes
          ${argSizes}
          let total_length = ${(0, utils_1.mapRange)(argAmount, (n) => `size_${n}`).join('+')};
          let (total_length256) = felt_to_uint256(total_length);
          let (res_loc) = wm_new(total_length256, ${(0, utils_2.uint256)(1)});
          // Copy values
          let start_loc = 0;
          ${concatCode.join('\n')}
          return (res_loc,);
      }
      `;
        return {
            name: funcName,
            code: code,
            functionsCalled: [
                this.requireImport(...importPaths_1.U128_FROM_FELT),
                this.requireImport(...importPaths_1.FELT_TO_UINT256),
                this.requireImport(...importPaths_1.WM_NEW),
                ...argSizesImports,
                ...concatImports,
            ],
        };
    }
    getSize(type, index) {
        if (type instanceof solc_typed_ast_1.StringType || type instanceof solc_typed_ast_1.BytesType) {
            return [
                (0, endent_1.default) `
          let (size256_${index}) = wm_dyn_array_length(arg_${index});
          let (size_${index}) = narrow_safe(size256_${index});
        `,
                [this.requireImport(...importPaths_1.WM_DYN_ARRAY_LENGTH), this.requireImport(...importPaths_1.NARROW_SAFE)],
            ];
        }
        if (type instanceof solc_typed_ast_1.IntType) {
            return [`let size_${index} = ${type.nBits / 8};`, []];
        }
        if (type instanceof solc_typed_ast_1.FixedBytesType) {
            return [`let size_${index} = ${type.size};`, []];
        }
        throw new errors_1.TranspileFailedError(`Attempted to get size for unexpected type ${(0, astPrinter_1.printTypeNode)(type)} in concat`);
    }
    getCopyFunctionCall(type, index) {
        if (type instanceof solc_typed_ast_1.StringType || type instanceof solc_typed_ast_1.BytesType) {
            return [
                `dynamic_array_copy_felt(res_loc, start_loc, end_loc, arg_${index}, 0);`,
                this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, 'dynamic_array_copy_felt'),
            ];
        }
        (0, assert_1.default)(type instanceof solc_typed_ast_1.FixedBytesType);
        if (type.size < 32) {
            return [
                `fixed_bytes_to_dynamic_array(res_loc, start_loc, end_loc, arg_${index}, 0, size_${index});`,
                this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, 'fixed_bytes_to_dynamic_array'),
            ];
        }
        return [
            `fixed_bytes256_to_dynamic_array(res_loc, start_loc, end_loc, arg_${index}, 0);`,
            this.requireImport(importPaths_1.DYNAMIC_ARRAYS_UTIL, 'fixed_bytes256_to_dynamic_array'),
        ];
    }
}
exports.MemoryArrayConcat = MemoryArrayConcat;
//# sourceMappingURL=arrayConcat.js.map