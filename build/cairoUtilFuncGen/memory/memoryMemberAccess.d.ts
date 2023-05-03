import { MemberAccess, FunctionCall, UserDefinedType } from 'solc-typed-ast';
import { StringIndexedFuncGen } from '../base';
export declare class MemoryMemberAccessGen extends StringIndexedFuncGen {
    gen(memberAccess: MemberAccess): FunctionCall;
    getOrCreateFuncDef(solType: UserDefinedType, memberName: string): import("../../export").CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=memoryMemberAccess.d.ts.map