import { ASTNode, TypeNode } from 'solc-typed-ast';
import { PrintOptions } from '../cli';
declare type PropPrinter = {
    prop: string;
    isRelevantNode: (n: ASTNode) => boolean;
    print: (value: unknown) => string | null;
};
declare type PropSearch = {
    prop: string;
    nodeType?: string;
    print?: (x: unknown) => string | null;
};
export declare class ASTPrinter {
    propPrinters: PropPrinter[];
    idsToHighlight: number[];
    printStubs: boolean;
    applyOptions(options: PrintOptions): void;
    lookFor(propSearch: string | PropSearch): ASTPrinter;
    highlightId(id: number): ASTPrinter;
    print(root: ASTNode): string;
}
export declare const DefaultASTPrinter: ASTPrinter;
export declare function printNode(node: ASTNode): string;
export declare function printTypeNode(node: TypeNode, detail?: boolean): string;
export {};
//# sourceMappingURL=astPrinter.d.ts.map