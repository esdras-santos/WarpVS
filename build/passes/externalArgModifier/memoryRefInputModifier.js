"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefTypeModifier = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../../ast/mapper");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nameModifiers_1 = require("../../utils/nameModifiers");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
class RefTypeModifier extends mapper_1.ASTMapper {
    /*
    This pass filters the inputParameters of FunctionDefinitions for reference types sitting in
    memory that are not DynArrays.
    
    The original dataLocation of each of the filtered VariableDeclarations is then set to CallData.
    
    A VariableDeclarationStatement is then inserted into the beginning of the function body with a
    cloned VariableDeclaration with the DataLocation set to Memory and the initialValue being an
    Identifier referencing the original VariableDeclaration in the Parameter list,
    with the DataLocation as CallData.
  
    This will trigger the dataAccessFunctionalizer to insert the necessary write UtilGens from
    CallDataToMemory.
  
    Before pass:
  
    struct structDef {
      uint8 member1;
      uint8 member2;
    }
  
    function testReturnMember(structDef memory structA) pure external returns (uint8) {
      return structA.member1;
    }
    
    After pass:
  
    function testReturnMember(structDef calldata structA) external pure returns (uint8) {
        structDef memory __warp_usrid_2_structA_mem = structA;
        return __warp_usrid1_structA.__warp_usrid_0_member1;
    }
    */
    visitFunctionDefinition(node, ast) {
        const body = node.vBody;
        if ((0, utils_1.isExternallyVisible)(node) && body !== undefined) {
            [...(0, functionGeneration_1.collectUnboundVariables)(body).entries()]
                .filter(([decl]) => node.vParameters.vParameters.includes(decl) &&
                decl.storageLocation === solc_typed_ast_1.DataLocation.Memory &&
                (0, nodeTypeProcessing_1.isReferenceType)((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference)) &&
                !(0, nodeTypeProcessing_1.isDynamicArray)((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference)))
                .forEach(([decl, ids]) => {
                const wmDecl = (0, cloning_1.cloneASTNode)(decl, ast);
                wmDecl.name = wmDecl.name + nameModifiers_1.CALLDATA_TO_MEMORY_FUNCTION_PARAMETER_PREFIX;
                decl.storageLocation = solc_typed_ast_1.DataLocation.CallData;
                const varDeclStatement = (0, nodeTemplates_1.createVariableDeclarationStatement)([wmDecl], (0, nodeTemplates_1.createIdentifier)(decl, ast), ast);
                body.insertAtBeginning(varDeclStatement);
                ids.forEach((id) => ast.replaceNode(id, (0, nodeTemplates_1.createIdentifier)(wmDecl, ast)));
            });
            ast.setContextRecursive(node);
        }
        this.commonVisit(node, ast);
    }
}
exports.RefTypeModifier = RefTypeModifier;
//# sourceMappingURL=memoryRefInputModifier.js.map