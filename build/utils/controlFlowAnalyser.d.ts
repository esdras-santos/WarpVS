import { Statement } from 'solc-typed-ast';
export declare function hasPathWithoutReturn(statement: Statement): boolean;
export declare function collectReachableStatements(statement: Statement): Set<Statement>;
export declare function collectReachableStatementsImpl(statement: Statement, collection: Set<Statement>): boolean;
//# sourceMappingURL=controlFlowAnalyser.d.ts.map