import { FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class ExternalFunctionCreator extends ASTMapper {
    internalToExternalFunctionMap: Map<FunctionDefinition, FunctionDefinition>;
    internalFunctionCallSet: Set<FunctionDefinition>;
    constructor(internalToExternalFunctionMap: Map<FunctionDefinition, FunctionDefinition>, internalFunctionCallSet: Set<FunctionDefinition>);
    visitFunctionDefinition(node: FunctionDefinition, ast: AST): void;
    private modifyPublicFunction;
    private createExternalFunctionDefinition;
    private insertReturnStatement;
}
//# sourceMappingURL=externalFunctionCreator.d.ts.map