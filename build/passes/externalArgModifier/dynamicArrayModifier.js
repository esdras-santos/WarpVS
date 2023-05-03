"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynArrayModifier = void 0;
const assert = require("assert");
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../../ast/cairoNodes");
const mapper_1 = require("../../ast/mapper");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
class DynArrayModifier extends mapper_1.ASTMapper {
    /*
    This pass will generate the solidity nodes that are needed pass dynamic memory
    arrays into external functions.
  
    Externally passed dynArrays in Cairo are 2 arguments while in Solidity they are
    1. This means a work around is needed for handling them. The dynArray is
    converted into a struct that holds its two members (len and ptr). The Identifiers
    that reference the original dynArray are now replaced with ones that reference
    the struct. ie dArray[1] -> dArray_struct.ptr[1]. This struct has storageLocation
    CallData.
  
    The above happens irrespective of whether the a dynArray is declared to be in
    Memory or CallData. If the original dynArray is in Memory an additional
    VariableDeclarationStatement is inserted at the beginning of the function body
    with the VariableDeclaration dataLocation in memory and the initialValue being
    an identifier that references the dynArray_struct. This will trigger the write
    in the dataAccessFunctionalizer and will use the appropriate functions to write
    the calldata struct containing the dynArray to Memory. Once again all the
    Identifiers that refer to the original dynArray are replaced with the identifiers
    that reference the VariableDeclaration.
    
    Notes on the CallData Struct Construction:
    The dynArray is passed to a StructConstructor FunctionCall that has 1 argument.
    The FunctionDefinition it references is as Stub that takes 1 argument and is
    never written. What is written is a StructDefinition with two members.
    
    Only once the cairoWriter is reached is the single argument in the
    ParameterListWriter and FunctionCallWriter split into two.
    All of this is to pass the sanity check that is run post transforming the AST.
  
    Before Pass:
  
    function dArrayMemory(uint8[] memory x) pure public returns (uint8[] memory) {
      return x;
    }
    
    function dArrayCalldata(uint8[] calldata x) pure public returns (uint8 calldata) {
      return x;
      }
  
    After Pass:
  
    function dArrayMemory(uint8[] memory x) pure public returns (uint8[] memory) {
      uint8[] calldata __warp_td_2 = wm_to_calldata(x);
      return __warp_td_2;
    }
  
    function dArrayCalldata(uint8[] calldata x) external pure returns (uint8[] calldata) {
      return x_dstruct;
    }
    */
    visitFunctionDefinition(node, ast) {
        const body = node.vBody;
        if ((0, utils_1.isExternallyVisible)(node) && body !== undefined) {
            [...(0, functionGeneration_1.collectUnboundVariables)(body).entries()]
                .filter(([decl]) => node.vParameters.vParameters.includes(decl) &&
                (decl.storageLocation === solc_typed_ast_1.DataLocation.Memory ||
                    decl.storageLocation === solc_typed_ast_1.DataLocation.CallData) &&
                (0, nodeTypeProcessing_1.isDynamicArray)((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference)))
                .forEach(([varDecl, ids]) => {
                // Irrespective of the whether the storage location is Memory or Calldata a struct is created to store the len & ptr
                // Note the location of this struct is in CallData.
                const dArrayStruct = (0, cloning_1.cloneASTNode)(varDecl, ast);
                dArrayStruct.name = dArrayStruct.name + '_dstruct';
                dArrayStruct.storageLocation = solc_typed_ast_1.DataLocation.CallData;
                const structConstructorCall = this.genStructConstructor(varDecl, node, ast);
                const structArrayStatement = (0, nodeTemplates_1.createVariableDeclarationStatement)([dArrayStruct], structConstructorCall, ast);
                body.insertAtBeginning(structArrayStatement);
                ast.setContextRecursive(structArrayStatement);
                assert(structConstructorCall.vReferencedDeclaration instanceof cairoNodes_1.CairoFunctionDefinition);
                if (varDecl.storageLocation === solc_typed_ast_1.DataLocation.Memory) {
                    const memoryArray = (0, cloning_1.cloneASTNode)(varDecl, ast);
                    memoryArray.name = memoryArray.name + '_mem';
                    const memArrayStatement = (0, nodeTemplates_1.createVariableDeclarationStatement)([memoryArray], (0, nodeTemplates_1.createIdentifier)(dArrayStruct, ast, undefined, varDecl), ast);
                    ids.forEach((identifier) => ast.replaceNode(identifier, (0, nodeTemplates_1.createIdentifier)(memoryArray, ast, solc_typed_ast_1.DataLocation.Memory, varDecl)));
                    body.insertAfter(memArrayStatement, structArrayStatement);
                }
                else {
                    ids.forEach((identifier) => ast.replaceNode(identifier, (0, nodeTemplates_1.createIdentifier)(dArrayStruct, ast, solc_typed_ast_1.DataLocation.CallData, varDecl)));
                }
                // The original dynArray argument is changed to having it's DataLocation in CallData.
                // Now both the dynArray and the struct representing it are in CallData.
                ast.setContextRecursive(node);
                varDecl.storageLocation = solc_typed_ast_1.DataLocation.CallData;
            });
            ast.setContextRecursive(node);
            this.commonVisit(node, ast);
        }
    }
    genStructConstructor(dArrayVarDecl, node, ast) {
        const structConstructor = ast
            .getUtilFuncGen(node)
            .calldata.dynArrayStructConstructor.gen(dArrayVarDecl, node);
        assert(structConstructor !== undefined);
        return structConstructor;
    }
}
exports.DynArrayModifier = DynArrayModifier;
//# sourceMappingURL=dynamicArrayModifier.js.map