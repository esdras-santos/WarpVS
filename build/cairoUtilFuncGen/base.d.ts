import { ArrayType, BytesType, DataLocation, FunctionDefinition, MappingType, SourceUnit, StringType, StructDefinition, TypeNode, UserDefinedType } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { CairoFunctionDefinition, CairoImportFunctionDefinition } from '../ast/cairoNodes';
import { ParameterInfo } from '../utils/functionGeneration';
export declare type CairoStructDef = {
    name: string;
    code: string;
};
export declare type GeneratedFunctionInfo = {
    name: string;
    code: string;
    functionsCalled: FunctionDefinition[];
};
export declare abstract class CairoUtilFuncGenBase {
    protected ast: AST;
    protected imports: Map<string, Set<string>>;
    protected sourceUnit: SourceUnit;
    constructor(ast: AST, sourceUnit: SourceUnit);
    protected requireImport(location: string[], name: string, inputs?: ParameterInfo[], outputs?: ParameterInfo[]): CairoImportFunctionDefinition;
}
export declare abstract class StringIndexedFuncGen extends CairoUtilFuncGenBase {
    protected generatedFunctionsDef: Map<string, CairoFunctionDefinition>;
}
export declare abstract class StringIndexedFuncGenWithAuxiliar extends StringIndexedFuncGen {
    protected auxiliarGeneratedFunctions: Map<string, CairoFunctionDefinition>;
    protected createAuxiliarGeneratedFunction(genFuncInfo: GeneratedFunctionInfo): import("../ast/cairoNodes").CairoGeneratedFunctionDefinition;
}
export declare function add(base: string, offset: number): string;
export declare function mul(base: string, scalar: number | bigint): string;
export declare function locationIfComplexType(type: TypeNode, location: DataLocation): DataLocation;
export declare function delegateBasedOnType<T>(type: TypeNode, dynamicArrayFunc: (type: ArrayType | BytesType | StringType) => T, staticArrayFunc: (type: ArrayType) => T, structFunc: (type: UserDefinedType, def: StructDefinition) => T, mappingFunc: (type: MappingType) => T, valueFunc: (type: TypeNode) => T): T;
//# sourceMappingURL=base.d.ts.map