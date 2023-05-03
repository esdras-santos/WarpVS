import { ASTNode, ContractDefinition, EnumDefinition, Expression, FunctionDefinition, InferType, LiteralKind, StructDefinition, TypeNode, VariableDeclarationStatement } from 'solc-typed-ast';
import { AST } from '../ast/ast';
export declare function getDeclaredTypeString(declaration: VariableDeclarationStatement): string;
export declare function getContractTypeString(node: ContractDefinition): string;
export declare function getStructTypeString(node: StructDefinition): string;
export declare function getEnumTypeString(node: EnumDefinition): string;
export declare function getFunctionTypeString(node: FunctionDefinition, inference: InferType, nodeInSourceUnit?: ASTNode): string;
export declare function getReturnTypeString(node: FunctionDefinition, ast: AST, nodeInSourceUnit?: ASTNode): string;
export declare function generateLiteralTypeString(value: string, kind?: LiteralKind): string;
export declare function generateExpressionTypeStringForASTNode(node: Expression, type: TypeNode, inference: InferType): string;
export declare function generateExpressionTypeString(type: TypeNode): string;
//# sourceMappingURL=getTypeString.d.ts.map