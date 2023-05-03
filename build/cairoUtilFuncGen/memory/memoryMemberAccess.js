"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryMemberAccessGen = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
/*
  Produces a separate function for each struct type and member name, that when given
  the location of a struct produces the location of that member
  The actual code in the function is very simple, but is placed in a cairo function
  so that it doesn't get converted into fixed-width solidity arithmetic. A CairoExpression
  node could serve as an optimisation here
*/
class MemoryMemberAccessGen extends base_1.StringIndexedFuncGen {
    gen(memberAccess) {
        const solType = (0, nodeTypeProcessing_1.safeGetNodeType)(memberAccess.vExpression, this.ast.inference);
        assert(solType instanceof solc_typed_ast_1.PointerType &&
            solType.to instanceof solc_typed_ast_1.UserDefinedType &&
            solType.to.definition instanceof solc_typed_ast_1.StructDefinition, `Trying to generate a member access for a type different than a struct: ${(0, astPrinter_1.printTypeNode)(solType)}`);
        const referencedDeclaration = memberAccess.vReferencedDeclaration;
        assert(referencedDeclaration instanceof solc_typed_ast_1.VariableDeclaration);
        const outType = referencedDeclaration.vType;
        assert(outType !== undefined);
        const funcDef = this.getOrCreateFuncDef(solType.to, memberAccess.memberName);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [memberAccess.vExpression], this.ast);
    }
    getOrCreateFuncDef(solType, memberName) {
        assert(solType.definition instanceof solc_typed_ast_1.StructDefinition);
        const structCairoType = cairoTypeSystem_1.CairoType.fromSol(solType, this.ast, cairoTypeSystem_1.TypeConversionContext.MemoryAllocation);
        const key = structCairoType.fullStringRepresentation + memberName;
        const existing = this.generatedFunctionsDef.get(key);
        if (existing !== undefined) {
            return existing;
        }
        const funcInfo = this.getOrCreate(structCairoType, memberName);
        const solTypeName = (0, utils_1.typeNameFromTypeNode)(solType, this.ast);
        const [outTypeName] = solType.definition.vMembers
            .filter((member) => member.name === memberName)
            .map((member) => member.vType);
        assert(outTypeName !== undefined);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [['loc', solTypeName, solc_typed_ast_1.DataLocation.Memory]], [['member_loc', (0, cloning_1.cloneASTNode)(outTypeName, this.ast), solc_typed_ast_1.DataLocation.Memory]], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(structCairoType, memberName) {
        const structName = structCairoType.toString();
        assert(structCairoType instanceof cairoTypeSystem_1.CairoStruct, `Attempting to access struct member ${memberName} of non-struct type ${structName}`);
        const offset = structCairoType.offsetOf(memberName);
        const funcName = `wm_${structName}_${memberName}`;
        return {
            name: funcName,
            code: [
                `func ${funcName}(loc: felt) -> (memberLoc: felt){`,
                `    return (${(0, base_1.add)('loc', offset)},);`,
                `}`,
            ].join('\n'),
            functionsCalled: [],
        };
    }
}
exports.MemoryMemberAccessGen = MemoryMemberAccessGen;
//# sourceMappingURL=memoryMemberAccess.js.map