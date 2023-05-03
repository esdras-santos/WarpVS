import { FunctionCall, FunctionDefinition } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ASTMapper } from '../../ast/mapper';
export declare class PublicFunctionCallModifier extends ASTMapper {
    internalToExternalFunctionMap: Map<FunctionDefinition, FunctionDefinition>;
    constructor(internalToExternalFunctionMap: Map<FunctionDefinition, FunctionDefinition>);
    visitFunctionCall(node: FunctionCall, ast: AST): void;
}
//# sourceMappingURL=publicFunctionCallModifier.d.ts.map