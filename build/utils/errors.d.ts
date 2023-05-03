/// <reference types="node" />
import { ASTNode } from 'solc-typed-ast';
export declare function logError(message: string): void;
export declare class CLIError extends Error {
    constructor(message: string);
}
export declare class InsaneASTError extends Error {
}
export declare class TranspilationAbandonedError extends Error {
    constructor(message: string, node?: ASTNode, highlight?: boolean);
}
export declare class WillNotSupportError extends TranspilationAbandonedError {
}
export declare class NotSupportedYetError extends TranspilationAbandonedError {
}
export declare class TranspileFailedError extends TranspilationAbandonedError {
}
export declare class PassOrderError extends TranspilationAbandonedError {
}
export declare function getErrorMessage(unsupportedPerSource: Map<string, [string, ASTNode][]>, initialMessage: string): string;
export interface ExecSyncError {
    stderr: Buffer | string;
}
export declare function instanceOfExecSyncError(object: any): object is ExecSyncError;
//# sourceMappingURL=errors.d.ts.map