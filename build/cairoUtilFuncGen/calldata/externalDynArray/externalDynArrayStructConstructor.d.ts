import { VariableDeclaration, FunctionCall, ArrayType, Expression, ASTNode, BytesType, StringType } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../../base';
export declare class ExternalDynArrayStructConstructor extends StringIndexedFuncGen {
    gen(astNode: VariableDeclaration, nodeInSourceUnit?: ASTNode): FunctionCall;
    gen(astNode: Expression, nodeInSourceUnit?: ASTNode): void;
    getOrCreateFuncDef(type: ArrayType | BytesType | StringType): import("../../../ast/cairoNodes").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=externalDynArrayStructConstructor.d.ts.map