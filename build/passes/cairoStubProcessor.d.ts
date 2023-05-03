import { FunctionDefinition, StructuredDocumentation } from 'solc-typed-ast';
import { AST } from '../ast/ast';
import { ASTMapper } from '../ast/mapper';
export declare class CairoStubProcessor extends ASTMapper {
    visitFunctionDefinition(node: FunctionDefinition, _ast: AST): void;
}
export declare function getDocString(doc: StructuredDocumentation | string | undefined): string | undefined;
export declare function isCairoStub(node: FunctionDefinition): boolean;
//# sourceMappingURL=cairoStubProcessor.d.ts.map