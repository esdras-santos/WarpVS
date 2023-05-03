"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumInputCheck = void 0;
const assert_1 = __importDefault(require("assert"));
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const functionGeneration_1 = require("../utils/functionGeneration");
const importPaths_1 = require("../utils/importPaths");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
const base_1 = require("./base");
// TODO: Does this enum input check overrides the input check from the general method?!
// It looks like it does
class EnumInputCheck extends base_1.StringIndexedFuncGen {
    // TODO: When is nodeInSourceUnit different thant the current sourceUnit??
    gen(node, nodeInput, enumDef, nodeInSourceUnit) {
        const nodeType = (0, nodeTypeProcessing_1.safeGetNodeType)(node, this.ast.inference);
        const inputType = (0, nodeTypeProcessing_1.safeGetNodeType)(nodeInput, this.ast.inference);
        this.sourceUnit = this.ast.getContainingRoot(nodeInSourceUnit);
        const funcDef = this.getOrCreateFuncDef(inputType, nodeType, enumDef);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [nodeInput], this.ast);
    }
    getOrCreateFuncDef(inputType, nodeType, enumDef) {
        (0, assert_1.default)(inputType instanceof solc_typed_ast_1.IntType);
        const key = enumDef.name + (inputType.nBits === 256 ? '256' : '');
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(inputType, enumDef);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['arg', (0, utils_1.typeNameFromTypeNode)(inputType, this.ast), solc_typed_ast_1.DataLocation.Default]], [['ret', (0, utils_1.typeNameFromTypeNode)(nodeType, this.ast), solc_typed_ast_1.DataLocation.Default]], this.ast, this.sourceUnit, {
            mutability: solc_typed_ast_1.FunctionStateMutability.Pure,
            stubKind: cairoNodes_1.FunctionStubKind.FunctionDefStub,
        });
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(type, enumDef) {
        const input256Bits = type.nBits === 256;
        const funcName = `enum_bound_check_${enumDef.name}` + (input256Bits ? '_256' : '');
        const imports = [this.requireImport(...importPaths_1.IS_LE_FELT)];
        if (input256Bits) {
            imports.push(this.requireImport(...importPaths_1.NARROW_SAFE), this.requireImport(...importPaths_1.U128_FROM_FELT));
        }
        const nMembers = enumDef.vMembers.length;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        func ${funcName}(${input256Bits ? 'arg_Uint256 : Uint256' : 'arg : felt'}) -> (arg: felt){
            alloc_locals;
            ${input256Bits ? 'let (arg) = narrow_safe(arg_Uint256);' : ``}
            let inRange : felt = is_le_felt(arg, ${nMembers - 1});
            with_attr error_message("Error: value out-of-bounds. Values passed to must be in enum range (0, ${nMembers - 1}]."){
                assert 1 = inRange;
            }
            return (arg,);
        }
      `,
            functionsCalled: imports,
        };
        return funcInfo;
    }
}
exports.EnumInputCheck = EnumInputCheck;
//# sourceMappingURL=enumInputCheck.js.map