"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GettersGenerator = void 0;
const assert_1 = __importDefault(require("assert"));
const mapper_1 = require("../../ast/mapper");
const solc_typed_ast_1 = require("solc-typed-ast");
const errors_1 = require("../../utils/errors");
const cloning_1 = require("../../utils/cloning");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const base_1 = require("../../cairoUtilFuncGen/base");
/**
* This is a pass to attach the getter function for a public state variable
* to the contract definition. for eg,

  contract A{
    uint public a;
  }

* The getter function for a public state variable will be attached to the contract
* definition as

  function a() public view returns (uint) {
    return a;
  }
* This is a getter function for a public state variable

* `for more information: https://docs.soliditylang.org/en/v0.8.13/contracts.html?highlight=getter#getter-functions
*/
class GettersGenerator extends mapper_1.ASTMapper {
    constructor(getterFunctions) {
        super();
        this.getterFunctions = getterFunctions;
    }
    visitContractDefinition(node, ast) {
        node.vStateVariables.forEach((v) => {
            // for every public state variable, create a getter function
            const stateVarType = v.vType;
            if (!stateVarType) {
                // skip getter function generation for state variable
                return;
            }
            if (v.stateVariable && v.visibility === solc_typed_ast_1.StateVariableVisibility.Public) {
                const funcDefID = ast.reserveId();
                const returnParameterList = (0, nodeTemplates_1.createParameterList)(genReturnParameters(stateVarType, funcDefID, ast), ast);
                const fnParams = (0, nodeTemplates_1.createParameterList)(genFunctionParams(0, stateVarType, funcDefID, ast), ast);
                const getterBody = (0, nodeTemplates_1.createBlock)([], ast);
                const getter = new solc_typed_ast_1.FunctionDefinition(funcDefID, '', node.id, solc_typed_ast_1.FunctionKind.Function, v.name, false, // virtual
                solc_typed_ast_1.FunctionVisibility.Public, solc_typed_ast_1.FunctionStateMutability.View, false, // isConstructor
                fnParams, returnParameterList, [], undefined, getterBody);
                node.appendChild(getter);
                genReturnBlock(0, getter, getterBody, v, stateVarType, ast);
                ast.setContextRecursive(getter);
                this.getterFunctions.set(v, getter);
            }
        });
    }
}
exports.GettersGenerator = GettersGenerator;
function genReturnParameters(vType, funcDefID, ast) {
    // It is an utility function to generate the return parameters
    // for a getter function corresponding to a public state variable
    if (!vType)
        return [];
    const newVarDecl = (type, dataLocation = solc_typed_ast_1.DataLocation.Default) => {
        if (!type) {
            throw new errors_1.TranspileFailedError(`Type not defined for variable`);
        }
        return new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
        false, // indexed
        '', funcDefID, false, // stateVariable
        dataLocation, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, type.typeString, undefined, (0, cloning_1.cloneASTNode)(type, ast));
    };
    if (vType instanceof solc_typed_ast_1.ElementaryTypeName) {
        if ((0, nodeTypeProcessing_1.isReferenceType)((0, nodeTypeProcessing_1.safeGetNodeType)(vType, ast.inference))) {
            return [newVarDecl(vType, solc_typed_ast_1.DataLocation.Memory)];
        }
        else {
            return [newVarDecl(vType)];
        }
    }
    else if (vType instanceof solc_typed_ast_1.ArrayTypeName) {
        return genReturnParameters(vType.vBaseType, funcDefID, ast);
    }
    else if (vType instanceof solc_typed_ast_1.Mapping) {
        return genReturnParameters(vType.vValueType, funcDefID, ast);
    }
    else if (vType instanceof solc_typed_ast_1.UserDefinedTypeName) {
        if (vType.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition) {
            // if the type is a struct, return the list for member declarations
            const returnVariables = [];
            // Mappings and arrays are omitted
            vType.vReferencedDeclaration.vMembers.forEach((v) => {
                if (v.vType instanceof solc_typed_ast_1.Mapping || v.vType instanceof solc_typed_ast_1.ArrayTypeName)
                    return;
                const memberTypeName = v.vType;
                (0, assert_1.default)(memberTypeName !== undefined, `Missing TypeName for ${v.name} when generating getter`);
                returnVariables.push(newVarDecl(v.vType, (0, nodeTypeProcessing_1.isReferenceType)((0, nodeTypeProcessing_1.safeGetNodeType)(memberTypeName, ast.inference))
                    ? solc_typed_ast_1.DataLocation.Memory
                    : solc_typed_ast_1.DataLocation.Default));
            });
            return returnVariables;
        }
        else {
            return [newVarDecl(vType)];
        }
    }
    else {
        throw new errors_1.NotSupportedYetError(`Getter fn generation for ${vType.type} typenames not implemented yet`);
    }
}
function genFunctionParams(varCount, vType, funcDefID, ast) {
    /*
      This function will return the list of parameters
      for a getter function of a public state var
      For e.g
        mapping(uint => mapping(address => uint256))
      The return list would be (uint _i0, address _i1)
    */
    if (!vType || vType instanceof solc_typed_ast_1.ElementaryTypeName) {
        return [];
    }
    else if (vType instanceof solc_typed_ast_1.ArrayTypeName) {
        return [
            new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
            false, // indexed
            `_i${varCount}`, funcDefID, false, // stateVariable
            solc_typed_ast_1.DataLocation.Default, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, 'uint256', undefined, (0, nodeTemplates_1.createUint256TypeName)(ast)),
            ...genFunctionParams(varCount + 1, vType.vBaseType, funcDefID, ast),
        ];
    }
    else if (vType instanceof solc_typed_ast_1.Mapping) {
        return [
            new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
            false, // indexed
            `_i${varCount}`, funcDefID, false, // stateVariable
            (0, base_1.locationIfComplexType)((0, nodeTypeProcessing_1.safeGetNodeType)(vType, ast.inference), solc_typed_ast_1.DataLocation.Memory), solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, vType.vKeyType.typeString, undefined, (0, cloning_1.cloneASTNode)(vType.vKeyType, ast)),
            ...genFunctionParams(varCount + 1, vType.vValueType, funcDefID, ast),
        ];
    }
    else if (vType instanceof solc_typed_ast_1.UserDefinedTypeName) {
        return [];
    }
    else {
        throw new errors_1.NotSupportedYetError(`Getter fn generation for ${vType.type} typenames not implemented yet`);
    }
}
function genReturnBlock(idx, getter, getterBody, v, vType, ast, baseExpression) {
    /*
      This is an recursive function to generate the return
      Block for a getter function of a public state variable.
  
      For e.g
  
      ```
        struct A{
          uint a;
          address b;
          mapping(int => int) c;
        }
        mapping(uint => mapping(address => A[])) public c;
      ```
  
      The return expression would be a tuple (c[i0][i1][i2].a , c[i0][i1][i2].b)
  
      `baseExpression`: is the expression that has been generated in
      the previous call of genReturnBlock
        for e.g `c[i0][i1][i2]` in `c[i0][i1][i2].a`
    */
    if (!vType) {
        throw new errors_1.TranspileFailedError(`Type of ${v.name} must be defined`);
    }
    if (vType instanceof solc_typed_ast_1.ElementaryTypeName) {
        getterBody.appendChild((0, nodeTemplates_1.createReturn)(baseExpression ?? (0, nodeTemplates_1.createIdentifier)(v, ast), getter.vReturnParameters.id, ast));
    }
    else if (vType instanceof solc_typed_ast_1.ArrayTypeName) {
        const baseExp = new solc_typed_ast_1.IndexAccess(ast.reserveId(), '', getTypeStringTypeName(vType.vBaseType), baseExpression ? (0, cloning_1.cloneASTNode)(baseExpression, ast) : (0, nodeTemplates_1.createIdentifier)(v, ast), (0, nodeTemplates_1.createIdentifier)(getter.vParameters.vParameters[idx], ast));
        return genReturnBlock(idx + 1, getter, getterBody, v, vType.vBaseType, ast, baseExp);
    }
    else if (vType instanceof solc_typed_ast_1.Mapping) {
        const baseExp = new solc_typed_ast_1.IndexAccess(ast.reserveId(), '', getTypeStringTypeName(vType.vValueType), baseExpression ? (0, cloning_1.cloneASTNode)(baseExpression, ast) : (0, nodeTemplates_1.createIdentifier)(v, ast), (0, nodeTemplates_1.createIdentifier)(getter.vParameters.vParameters[idx], ast));
        return genReturnBlock(idx + 1, getter, getterBody, v, vType.vValueType, ast, baseExp);
    }
    else if (vType instanceof solc_typed_ast_1.UserDefinedTypeName) {
        if (vType.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition) {
            // list of return expressions for a struct output
            const returnExpressions = [];
            // In case of struct, an extra struct variable declaration is used
            /*
              struct A{uint a;uint b};
              A [] public a;
            `getter fn`:
              function a(uint _i0) ... return(...){
                A _temp = a[_i0];
                return (_temp.a, _temp.b)
              }
            */
            let tempCount = 0;
            const tempStructVarDeclaration = (type, initialValue) => {
                const structVarDecl = new solc_typed_ast_1.VariableDeclaration(ast.reserveId(), '', false, // constant
                false, // indexed
                `_temp${tempCount++}`, getter.id, false, // stateVariable
                solc_typed_ast_1.DataLocation.Storage, solc_typed_ast_1.StateVariableVisibility.Internal, solc_typed_ast_1.Mutability.Mutable, type.typeString, undefined, (0, cloning_1.cloneASTNode)(type, ast));
                ast.setContextRecursive(structVarDecl);
                const structDeclStmt = new solc_typed_ast_1.VariableDeclarationStatement(ast.reserveId(), '', [structVarDecl.id], [structVarDecl], initialValue);
                getterBody.appendChild(structDeclStmt);
                return structVarDecl;
            };
            const tempStructVarDecl = tempStructVarDeclaration(vType, baseExpression ? (0, cloning_1.cloneASTNode)(baseExpression, ast) : (0, nodeTemplates_1.createIdentifier)(v, ast));
            vType.vReferencedDeclaration.vMembers.forEach((m) => {
                if (!m.vType)
                    return;
                // struct public state variable getters don't return Mappings and Arrays
                if (m.vType instanceof solc_typed_ast_1.Mapping || m.vType instanceof solc_typed_ast_1.ArrayTypeName) {
                    return;
                }
                const memberAccessExp = new solc_typed_ast_1.MemberAccess(ast.reserveId(), '', getTypeStringTypeName(m.vType), (0, nodeTemplates_1.createIdentifier)(tempStructVarDecl, ast), m.name, m.id);
                if (m.vType instanceof solc_typed_ast_1.UserDefinedTypeName &&
                    m.vType.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition) {
                    const memberStructVarDeclaration = tempStructVarDeclaration(m.vType, memberAccessExp);
                    returnExpressions.push((0, nodeTemplates_1.createIdentifier)(memberStructVarDeclaration, ast));
                }
                else {
                    returnExpressions.push(memberAccessExp);
                }
            });
            getterBody.appendChild((0, nodeTemplates_1.createReturn)((0, utils_1.toSingleExpression)(returnExpressions, ast), getter.vReturnParameters.id, ast));
        }
        else {
            getterBody.appendChild((0, nodeTemplates_1.createReturn)(baseExpression ?? (0, nodeTemplates_1.createIdentifier)(v, ast), getter.vReturnParameters.id, ast));
        }
    }
    else {
        throw new errors_1.NotSupportedYetError(`Getter fn generation for ${vType?.type} typenames not implemented yet`);
    }
}
function getTypeStringTypeName(type) {
    if (!type)
        return '';
    if (type instanceof solc_typed_ast_1.ElementaryTypeName) {
        return type.typeString;
    }
    if (type instanceof solc_typed_ast_1.ArrayTypeName) {
        const baseTypeString = getTypeStringTypeName(type.vBaseType);
        // extract the string after last '[' and before last ']'
        const lengthString = type.typeString.substring(type.typeString.lastIndexOf('[') + 1, type.typeString.lastIndexOf(']'));
        return `${baseTypeString}[${lengthString}] storage ref`;
    }
    if (type instanceof solc_typed_ast_1.Mapping) {
        const keyTypeString = getTypeStringTypeName(type.vKeyType);
        const valueTypeString = getTypeStringTypeName(type.vValueType);
        return `mapping(${keyTypeString} => ${valueTypeString})`;
    }
    if (type instanceof solc_typed_ast_1.UserDefinedTypeName) {
        if (type.vReferencedDeclaration instanceof solc_typed_ast_1.StructDefinition) {
            return `${type.typeString} storage ref`;
        }
    }
    return type.typeString;
}
//# sourceMappingURL=gettersGenerator.js.map