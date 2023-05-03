"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printTypeNode = exports.printNode = exports.DefaultASTPrinter = exports.ASTPrinter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const formatting_1 = require("./formatting");
const utils_1 = require("./utils");
class ASTPrinter {
    constructor() {
        this.propPrinters = [];
        this.idsToHighlight = [];
        this.printStubs = true;
    }
    applyOptions(options) {
        options.highlight?.forEach((id) => this.highlightId(parseInt(id)));
        this.printStubs = !!options.stubs;
    }
    lookFor(propSearch) {
        if (typeof propSearch === 'string') {
            this.propPrinters.push({
                prop: propSearch,
                isRelevantNode: () => true,
                print: (x) => `${x}`,
            });
        }
        else {
            this.propPrinters.push({
                prop: propSearch.prop,
                isRelevantNode: (n) => propSearch.nodeType === undefined || n.type === propSearch.nodeType,
                print: (x) => (propSearch.print === undefined ? `${x}` : propSearch.print(x)),
            });
        }
        return this;
    }
    highlightId(id) {
        if (!this.idsToHighlight.includes(id)) {
            this.idsToHighlight.push(id);
        }
        return this;
    }
    print(root) {
        const propString = this.propPrinters
            .filter(({ isRelevantNode }) => isRelevantNode(root))
            .map(({ prop, print }) => {
            const value = (0, utils_1.extractProperty)(prop, root);
            if (value === undefined)
                return '';
            const formattedValue = print(value);
            if (formattedValue === null)
                return '';
            return `\n${root.children.length > 0 ? '| ' : '  '}  ${prop}: ${formattedValue}`;
        })
            .join('');
        const subtrees = root.children
            .filter((child) => this.printStubs ||
            !(child instanceof cairoNodes_1.CairoFunctionDefinition &&
                child.functionStubKind !== cairoNodes_1.FunctionStubKind.None))
            .map((child, index, children) => this.print(child)
            .split('\n')
            .map((line, lineIndex) => {
            if (lineIndex === 0)
                return `\n+-${line}`;
            else if (index === children.length - 1)
                return `\n  ${line}`;
            else
                return `\n| ${line}`;
        })
            .join(''));
        const printedRoot = this.idsToHighlight.includes(root.id)
            ? (0, formatting_1.cyan)((0, formatting_1.underline)(printNode(root)))
            : printNode(root);
        return `${printedRoot}${propString}${subtrees.join('')}`;
    }
}
exports.ASTPrinter = ASTPrinter;
exports.DefaultASTPrinter = new ASTPrinter()
    .lookFor('absolutePath')
    .lookFor('canonicalName')
    .lookFor({
    prop: 'context',
    nodeType: 'SourceUnit',
    print: context,
})
    .lookFor('fieldNames')
    .lookFor('functionReturnParameters')
    .lookFor('hexValue')
    .lookFor({
    prop: 'implicits',
    nodeType: 'CairoFunctionDefinition',
    print: implicits,
})
    .lookFor({
    prop: 'kind',
    nodeType: 'FunctionDefinition',
    print: functionKind,
})
    .lookFor({
    prop: 'kind',
    nodeType: 'CairoFunctionDefinition',
    print: functionKind,
})
    .lookFor({
    prop: 'linearizedBaseContracts',
    print: linearizedBaseContracts,
})
    .lookFor('memberName')
    .lookFor('name')
    .lookFor('operator')
    .lookFor('referencedDeclaration')
    .lookFor('returnTypes')
    .lookFor('scope')
    .lookFor('stateMutability')
    .lookFor({
    prop: 'storageAllocations',
    nodeType: 'CairoContract',
    print: storageAllocations,
})
    .lookFor('storageLocation')
    .lookFor({
    prop: 'symbolAliases',
    print: symbolAliases,
})
    .lookFor('text')
    .lookFor('typeString')
    .lookFor('value')
    .lookFor('visibility');
function printNode(node) {
    if (node instanceof solc_typed_ast_1.FunctionCall) {
        return `${node.type} #${node.id} ${node.vFunctionName}`;
    }
    if ('name' in node) {
        //@ts-ignore name clearly exists in node
        return `${node.type} #${node.id} ${node.name}`;
    }
    return `${node.type} #${node.id}`;
}
exports.printNode = printNode;
function printTypeNode(node, detail) {
    let type = `${node.constructor.name}`;
    if (detail) {
        type = `${printTypeNodeTypes(node)}`;
    }
    return `${node.pp()} (${type})`;
}
exports.printTypeNode = printTypeNode;
function printTypeNodeTypes(node) {
    let subTypes = '';
    if (node instanceof solc_typed_ast_1.ArrayType) {
        subTypes = `(${printTypeNodeTypes(node.elementT)}, ${node.size})`;
    }
    else if (node instanceof solc_typed_ast_1.MappingType) {
        subTypes = `(${printTypeNodeTypes(node.keyType)}, ${printTypeNodeTypes(node.valueType)})`;
    }
    else if (node instanceof solc_typed_ast_1.PointerType) {
        subTypes = `(${printTypeNodeTypes(node.to)}, ${node.location})`;
    }
    else if (node instanceof solc_typed_ast_1.TypeNameType) {
        subTypes = `(${printTypeNodeTypes(node.type)})`;
    }
    return `${node.constructor.name} ${subTypes}`;
}
// Property printing functions-------------------------------------------------
function context(x) {
    return `${x instanceof solc_typed_ast_1.ASTContext ? x.id : 'not a context'}`;
}
function implicits(x) {
    if (!(x instanceof Set))
        throw new Error('Implicits not a set');
    return `${[...x.values()]}`;
}
function functionKind(x) {
    return `${x}`;
}
function linearizedBaseContracts(x) {
    if (!Array.isArray(x))
        throw new Error('linearizedBaseContracts not an array');
    return x.map((elem) => `${elem}`).join(', ');
}
function storageAllocations(x) {
    if (!(x instanceof Map))
        throw new Error('storage allocations not a map');
    return [...x.entries()]
        .map(([n, v]) => {
        if (!(n instanceof solc_typed_ast_1.ASTNode))
            throw new Error(`n should be astnode, found ${n.constructor.name}`);
        return `#${n.id}->${v}`;
    })
        .join();
}
function symbolAliases(x) {
    if (!(x instanceof Array))
        throw new Error('symbolAliases not a array');
    return `[${x
        .map((alias) => `foreign: ${alias.foreign instanceof solc_typed_ast_1.ASTNode ? printNode(alias.foreign) : `${alias.foreign}`} local: ${alias.local}`)
        .join(', ')}]`;
}
//# sourceMappingURL=astPrinter.js.map