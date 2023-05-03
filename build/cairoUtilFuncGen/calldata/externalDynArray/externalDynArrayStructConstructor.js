"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalDynArrayStructConstructor = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const assert_1 = __importDefault(require("assert"));
const functionGeneration_1 = require("../../../utils/functionGeneration");
const cairoTypeSystem_1 = require("../../../utils/cairoTypeSystem");
const base_1 = require("../../base");
const nodeTemplates_1 = require("../../../utils/nodeTemplates");
const cairoNodes_1 = require("../../../ast/cairoNodes");
const utils_1 = require("../../../utils/utils");
const astPrinter_1 = require("../../../utils/astPrinter");
const nodeTypeProcessing_1 = require("../../../utils/nodeTypeProcessing");
const INDENT = ' '.repeat(4);
class ExternalDynArrayStructConstructor extends base_1.StringIndexedFuncGen {
    gen(astNode, nodeInSourceUnit) {
        const type = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeTypeInCtx)(astNode, this.ast.inference, nodeInSourceUnit ?? astNode))[0];
        (0, assert_1.default)((0, nodeTypeProcessing_1.isDynamicArray)(type), `Attempted to create dynArray struct for non-dynarray type ${(0, astPrinter_1.printTypeNode)(type)}`);
        const funcDef = this.getOrCreateFuncDef(type);
        if (astNode instanceof solc_typed_ast_1.VariableDeclaration) {
            const functionInputs = [
                (0, nodeTemplates_1.createIdentifier)(astNode, this.ast, solc_typed_ast_1.DataLocation.CallData, nodeInSourceUnit ?? astNode),
            ];
            return (0, functionGeneration_1.createCallToFunction)(funcDef, functionInputs, this.ast);
        }
        else {
            // When CallData DynArrays are being returned and we do not need the StructConstructor
            // to be returned, we just need the StructDefinition to be in the contract.
            return;
        }
    }
    getOrCreateFuncDef(type) {
        const elemType = (0, nodeTypeProcessing_1.getElementType)(type);
        const key = elemType.pp();
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(elemType);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['darray', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.CallData]], [['darray_struct', (0, utils_1.typeNameFromTypeNode)(type, this.ast), solc_typed_ast_1.DataLocation.CallData]], this.ast, this.sourceUnit, {
            mutability: solc_typed_ast_1.FunctionStateMutability.View,
            stubKind: cairoNodes_1.FunctionStubKind.StructDefStub,
            acceptsRawDArray: true,
        });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(elemType) {
        const elementCairoType = cairoTypeSystem_1.CairoType.fromSol(elemType, this.ast, cairoTypeSystem_1.TypeConversionContext.CallDataRef);
        const structName = (0, cairoTypeSystem_1.generateCallDataDynArrayStructName)(elemType, this.ast);
        const funcInfo = {
            name: structName,
            code: [
                `struct ${structName}{`,
                `${INDENT} len : felt ,`,
                `${INDENT} ptr : ${elementCairoType.toString()}*,`,
                `}`,
            ].join('\n'),
            functionsCalled: [],
        };
        return funcInfo;
    }
}
exports.ExternalDynArrayStructConstructor = ExternalDynArrayStructConstructor;
//# sourceMappingURL=externalDynArrayStructConstructor.js.map