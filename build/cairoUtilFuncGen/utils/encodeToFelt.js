"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeAsFelt = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const export_1 = require("../../export");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
/**
 * This class generate `encode` cairo util functions with the objective of making
 * a list of values into a single list where all items are felts. For example:
 * Value list: [a : felt, b : Uint256, c : (felt, felt, felt), d_len : felt, d : felt*]
 * Result: [a, b.low, b.high, c[0], c[1], c[2], d_len, d[0], ..., d[d_len - 1]]
 *
 * It generates a different function depending on the amount of expressions
 * and their types. It also generate different auxiliar functions depending
 * on the type to encode.
 *
 * Auxiliar functions can and will be reused if possible between different
 * generated encoding functions. I.e. the auxiliar function to encode felt
 * dynamic arrays will be always the same
 */
class EncodeAsFelt extends base_1.StringIndexedFuncGenWithAuxiliar {
    constructor(externalArrayGen, ast, sourceUnit) {
        super(ast, sourceUnit);
        this.externalArrayGen = externalArrayGen;
    }
    /**
     * Given a expression list it generates a `encode` cairo function definition
     * and call that serializes the arguments into a list of felts
     * @param expressions expression list
     * @param expectedTypes expected type for each expression of the list
     * @param sourceUnit source unit where the expression is defined
     * @returns a function call that serializes the value of `expressions`
     */
    gen(expressions, expectedTypes) {
        (0, assert_1.default)(expectedTypes.length === expressions.length);
        expectedTypes = expectedTypes.map((type) => (0, solc_typed_ast_1.generalizeType)(type)[0]);
        const funcDef = this.getOrCreateFuncDef(expectedTypes);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, expressions, this.ast);
    }
    getOrCreateFuncDef(typesToEncode) {
        const key = typesToEncode.map((t) => t.pp()).join(',');
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(typesToEncode);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, typesToEncode.map((exprT, index) => {
            const input = [`arg${index}`, (0, utils_1.typeNameFromTypeNode)(exprT, this.ast)];
            return (0, nodeTypeProcessing_1.isValueType)(exprT) ? input : [...input, solc_typed_ast_1.DataLocation.CallData];
        }), [['result', (0, nodeTemplates_1.createBytesTypeName)(this.ast), solc_typed_ast_1.DataLocation.CallData]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    /**
     * Given a type list it generates a `encode` cairo function definition
     * that serializes the arguments into a list of felts
     * @param typesToEncode type list
     * @returns the name of the generated function
     */
    getOrCreate(typesToEncode) {
        const [parameters, encodeCode, encodeCalls] = typesToEncode.reduce(([parameters, encodeCode, encodeCalls], type, index) => {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
            const prefix = `arg_${index}`;
            if ((0, nodeTypeProcessing_1.isDynamicArray)(type)) {
                // Handle dynamic arrays
                (0, assert_1.default)(cairoType instanceof cairoTypeSystem_1.CairoDynArray);
                const arrayName = `${prefix}_dynamic`;
                const auxFunc = this.getOrCreateAuxiliar(type);
                return [
                    [...parameters, ` ${arrayName} : ${cairoType.typeName}`],
                    [
                        ...encodeCode,
                        `assert decode_array[total_size] = ${arrayName}.len;`,
                        `let total_size = total_size + 1;`,
                        `let (total_size) = ${auxFunc.name}(total_size, decode_array, 0, ${arrayName}.len, ${arrayName}.ptr);`,
                    ],
                    [...encodeCalls, auxFunc],
                ];
            }
            else if (type instanceof solc_typed_ast_1.ArrayType) {
                // Handle static arrays
                const auxFunc = this.getOrCreateAuxiliar(type);
                return [
                    [...parameters, `${prefix}_static : ${cairoType.toString()}`],
                    [
                        ...encodeCode,
                        `let (total_size) = ${auxFunc.name}(total_size, decode_array, ${prefix}_static);`,
                    ],
                    [...encodeCalls, auxFunc],
                ];
            }
            else if ((0, nodeTypeProcessing_1.isStruct)(type)) {
                // Handle structs
                (0, assert_1.default)(cairoType instanceof cairoTypeSystem_1.CairoStruct);
                const auxFuncName = this.getOrCreateAuxiliar(type);
                return [
                    [...parameters, `${prefix}_${cairoType.name} : ${cairoType.typeName}`],
                    [
                        ...encodeCode,
                        `let (total_size) = ${auxFuncName.name}(total_size, decode_array, ${prefix}_${cairoType.name});`,
                    ],
                    [...encodeCalls, auxFuncName],
                ];
            }
            else if ((0, nodeTypeProcessing_1.isValueType)(type)) {
                // Handle value types
                return [
                    [...parameters, `${prefix} : ${cairoType.typeName}`],
                    [
                        ...encodeCode,
                        cairoType.width > 1
                            ? (0, endent_1.default) `
                    assert decode_array[total_size] = ${prefix}.low;
                    assert decode_array[total_size + 1] = ${prefix}.high;
                    let total_size = total_size + 2;
                  `
                            : (0, endent_1.default) `
                    assert decode_array[total_size] = ${prefix};
                    let total_size = total_size + 1;
                  `,
                    ],
                    [...encodeCalls],
                ];
            }
            throw new errors_1.WillNotSupportError(`Decoding ${(0, astPrinter_1.printTypeNode)(type)} into felt dynamic array is not supported`);
        }, [new Array(), new Array(), new Array()]);
        const resultStruct = this.externalArrayGen.getOrCreateFuncDef(new solc_typed_ast_1.BytesType());
        const cairoParams = parameters.join(',');
        const funcName = `encode_as_felt${this.generatedFunctionsDef.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(${cairoParams}) -> (calldata_array : ${resultStruct.name}){
        alloc_locals;
        let total_size : felt = 0;
        let (decode_array : felt*) = alloc();
        ${encodeCode.join('\n')}
        let result = ${resultStruct.name}(total_size, decode_array);
        return (result,);
      }
    `;
        const importFunc = this.requireImport(...importPaths_1.ALLOC);
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: [importFunc, ...encodeCalls, resultStruct].filter(export_1.notUndefined),
        };
        return funcInfo;
    }
    /**
     * Given a type it generates the appropriate auxiliar encoding function for this specific type.
     * @param type to encode (only arrays and structs allowed)
     * @returns name of the generated function
     */
    getOrCreateAuxiliar(type) {
        const key = type.pp();
        const existing = this.auxiliarGeneratedFunctions.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const unexpectedTypeFunc = () => {
            throw new errors_1.NotSupportedYetError(`Encoding of type ${(0, astPrinter_1.printTypeNode)(type)} is not supported yet`);
        };
        const cairoFunc = (0, base_1.delegateBasedOnType)(type, (type) => this.generateDynamicArrayEncodeFunction(type), (type) => this.generateStaticArrayEncodeFunction(type), (type) => this.generateStructEncodeFunction(type), unexpectedTypeFunc, unexpectedTypeFunc);
        this.auxiliarGeneratedFunctions.set(key, cairoFunc);
        return cairoFunc;
    }
    /**
     * Generates cairo code depending on the type. If it is a value type it generates
     * the appropriate instructions. If it is a an array or struct, it generates a function
     * call
     * @param type type to generate encoding code
     * @param currentElementName cairo variable to encode to felt
     * @returns generated code
     */
    generateEncodeCode(type, currentElementName) {
        if ((0, nodeTypeProcessing_1.isValueType)(type)) {
            const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
            return [
                cairoType.width === 2
                    ? [
                        `assert to_array[to_index] = ${currentElementName}.low;`,
                        `assert to_array[to_index + 1] = ${currentElementName}.high;`,
                        `let to_index = to_index + 2;`,
                    ]
                    : [`assert to_array[to_index] = ${currentElementName};`, `let to_index = to_index + 1;`],
                [],
            ];
        }
        const auxFuncName = this.getOrCreateAuxiliar(type);
        return [
            [`let (to_index) = ${auxFuncName.name}(to_index, to_array, ${currentElementName});`],
            [auxFuncName],
        ];
    }
    generateDynamicArrayEncodeFunction(type) {
        const cairoElementType = cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.getElementType)(type), this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const elemenT = (0, nodeTypeProcessing_1.getElementType)(type);
        const [encodingCode, encodingCalls] = this.generateEncodeCode(elemenT, 'current_element');
        const funcName = `encode_dynamic_array${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(
        to_index : felt,
        to_array : felt*,
        from_index: felt,
        from_size: felt,
        from_array: ${cairoElementType.toString()}*
      ) -> (total_copied : felt){
        alloc_locals;
        if (from_index == from_size){
          return (total_copied=to_index,);
        }
        let current_element = from_array[from_index];
        ${encodingCode.join('\n')}
        return ${funcName}(to_index, to_array, from_index + 1, from_size, from_array);
      }
    `;
        const funcInfo = {
            name: funcName,
            code: code,
            functionsCalled: encodingCalls,
        };
        return (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [], [], this.ast, this.sourceUnit);
    }
    generateStructEncodeFunction(type) {
        (0, assert_1.default)(type.definition instanceof solc_typed_ast_1.StructDefinition);
        const [encodeCode, encodeCalls] = type.definition.vMembers.reduce(([encodeCode, encodeCalls], varDecl, index) => {
            const varType = (0, nodeTypeProcessing_1.safeGetNodeType)(varDecl, this.ast.inference);
            const [memberEncodeCode, memberEncodeCalls] = this.generateEncodeCode(varType, `member_${index}`);
            return [
                [
                    ...encodeCode,
                    `let member_${index} = from_struct.${varDecl.name};`,
                    ...memberEncodeCode,
                ],
                [...encodeCalls, ...memberEncodeCalls],
            ];
        }, [new Array(), new Array()]);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        (0, assert_1.default)(cairoType instanceof cairoTypeSystem_1.CairoStruct);
        const funcName = `encode_struct_${cairoType.name}`;
        return this.createAuxiliarGeneratedFunction({
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(
           to_index : felt, to_array : felt*, from_struct : ${cairoType.toString()}
        ) -> (total_copied : felt){
          alloc_locals;
          ${encodeCode.join('\n')}
          return (to_index,);
        }
      `,
            functionsCalled: encodeCalls,
        });
    }
    // TODO: Do a small version of static array encoding
    generateStaticArrayEncodeFunction(type) {
        (0, assert_1.default)(type.size !== undefined);
        const cairoType = cairoTypeSystem_1.CairoType.fromSol(type, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const elemenT = type.elementT;
        const cairoElementT = cairoTypeSystem_1.CairoType.fromSol(elemenT, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        let staticArrayEncoding;
        let funcsCalled;
        if ((0, nodeTypeProcessing_1.isValueType)(elemenT)) {
            staticArrayEncoding =
                cairoElementT.width === 2
                    ? (element) => [
                        `assert to_array[to_index] = ${element}.low;`,
                        `assert to_array[to_index + 1] = ${element}.high;`,
                        `let to_index = to_index + 2;`,
                    ]
                    : (element) => [
                        `assert to_array[to_index] = ${element};`,
                        `let to_index = to_index + 1;`,
                    ];
            funcsCalled = [];
        }
        else {
            const auxFunc = this.getOrCreateAuxiliar(elemenT);
            staticArrayEncoding = (element) => [
                `let (to_index) = ${auxFunc.name}(to_index, to_array, ${element});`,
            ];
            funcsCalled = [auxFunc];
        }
        const encodeCode = (0, utils_1.mapRange)((0, utils_1.narrowBigIntSafe)(type.size), (index) => {
            return (0, endent_1.default) `
        let elem_${index} = from_static_array[${index}];
        ${staticArrayEncoding(`elem_${index}`).join('\n')}
      `;
        });
        const funcName = `encode_static_size${type.size}_array_${this.auxiliarGeneratedFunctions.size}`;
        const code = (0, endent_1.default) `
      func ${funcName}(to_index : felt, to_array : felt*, from_static_array : ${cairoType.toString()}) -> (total_copied : felt){
        alloc_locals;
        ${encodeCode.join('\n')}
        return (to_index,);
      }
    `;
        return this.createAuxiliarGeneratedFunction({
            name: funcName,
            code: code,
            functionsCalled: funcsCalled,
        });
    }
}
exports.EncodeAsFelt = EncodeAsFelt;
//# sourceMappingURL=encodeToFelt.js.map