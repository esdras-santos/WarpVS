import { ContractDefinition, Identifier, MemberAccess, SourceUnit, VariableDeclaration } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ExternalContractInterfaceInserter extends ASTMapper {
    private contractInterfaces;
    constructor(contractInterfaces: Map<number, ContractDefinition>);
    visitIdentifier(node: Identifier, ast: AST): void;
    visitMemberAccess(node: MemberAccess, ast: AST): void;
    visitVariableDeclaration(node: VariableDeclaration, ast: AST): void;
}
export declare function getTemporaryInterfaceName(contractName: string): string;
export declare function genContractInterface(contract: ContractDefinition, sourceUnit: SourceUnit, ast: AST): ContractDefinition;
//# sourceMappingURL=externalContractInterfaceInserter.d.ts.map