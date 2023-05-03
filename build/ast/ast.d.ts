import { ASTContext, ASTNode, Expression, Identifier, InferType, SourceUnit, Statement, TypeName, VariableDeclarationStatement } from 'solc-typed-ast';
import { CairoUtilFuncGen } from '../cairoUtilFuncGen';
import { SolcOutput } from '../solCompile';
import { CairoImportFunctionDefinition } from './cairoNodes';
import { ParameterInfo } from '../export';
export declare class AST {
    roots: SourceUnit[];
    solidityABI: SolcOutput['result'];
    private cairoUtilFuncGen;
    context: ASTContext;
    inference: InferType;
    readonly tempId = -1;
    constructor(roots: SourceUnit[], compilerVersion: string, solidityABI: SolcOutput['result']);
    extractToConstant(node: Expression, vType: TypeName, newName: string): [insertedIdentifier: Identifier, declaration: VariableDeclarationStatement];
    getContainingRoot(node: ASTNode): SourceUnit;
    getContainingScope(node: ASTNode): number;
    getUtilFuncGen(node: ASTNode): CairoUtilFuncGen;
    insertStatementAfter(existingNode: ASTNode, newStatement: Statement): void;
    insertStatementBefore(existingNode: ASTNode, newStatement: Statement): void;
    registerChild(child: ASTNode, parent: ASTNode): number;
    registerImport(node: ASTNode, location: string[], name: string, inputs: ParameterInfo[], outputs: ParameterInfo[], options?: {
        acceptsRawDarray?: boolean;
        acceptsUnpackedStructArray?: boolean;
    }): CairoImportFunctionDefinition;
    removeStatement(statement: Statement): void;
    replaceNode(oldNode: Expression, newNode: Expression, parent?: ASTNode): number;
    replaceNode(oldNode: Statement, newNode: Statement, parent?: ASTNode): number;
    reserveId(): number;
    setContextRecursive(node: ASTNode): number;
}
//# sourceMappingURL=ast.d.ts.map