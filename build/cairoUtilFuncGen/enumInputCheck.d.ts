import { ASTNode, EnumDefinition, Expression, FunctionCall, TypeNode } from 'solc-typed-ast';
import { StringIndexedFuncGen } from './base';
export declare class EnumInputCheck extends StringIndexedFuncGen {
    gen(node: Expression, nodeInput: Expression, enumDef: EnumDefinition, nodeInSourceUnit: ASTNode): FunctionCall;
    getOrCreateFuncDef(inputType: TypeNode, nodeType: TypeNode, enumDef: EnumDefinition): import("../ast/cairoNodes").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=enumInputCheck.d.ts.map