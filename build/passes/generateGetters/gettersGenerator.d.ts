import { ASTMapper } from '../../ast/mapper';
import { ContractDefinition, FunctionDefinition, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
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
export declare class GettersGenerator extends ASTMapper {
    private getterFunctions;
    constructor(getterFunctions: Map<VariableDeclaration, FunctionDefinition>);
    visitContractDefinition(node: ContractDefinition, ast: AST): void;
}
//# sourceMappingURL=gettersGenerator.d.ts.map