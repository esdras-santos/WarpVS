import { MemberAccess, FunctionCall, UserDefinedType } from 'solc-typed-ast';
import { CairoFunctionDefinition } from '../../ast/cairoNodes';
import { StringIndexedFuncGen } from '../base';
export declare class StorageMemberAccessGen extends StringIndexedFuncGen {
    gen(memberAccess: MemberAccess): FunctionCall;
    getOrCreateFuncDef(solType: UserDefinedType, memberName: string): CairoFunctionDefinition;
    private getOrCreate;
}
//# sourceMappingURL=storageMemberAccess.d.ts.map