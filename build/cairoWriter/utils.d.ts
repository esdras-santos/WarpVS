import { ASTNode, ASTWriter, SourceUnit, StructuredDocumentation } from 'solc-typed-ast';
export declare const INDENT: string;
export declare const INCLUDE_CAIRO_DUMP_FUNCTIONS = false;
export declare function getDocumentation(documentation: string | StructuredDocumentation | undefined, writer: ASTWriter): string;
export declare function getInterfaceNameForContract(contractName: string, nodeInSourceUnit: ASTNode, interfaceNameMappings: Map<SourceUnit, Map<string, string>>): string;
//# sourceMappingURL=utils.d.ts.map