"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCairoStub = exports.getDocString = exports.CairoStubProcessor = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoNodes_1 = require("../ast/cairoNodes");
const mapper_1 = require("../ast/mapper");
const errors_1 = require("../utils/errors");
const nameModifiers_1 = require("../utils/nameModifiers");
const utils_1 = require("../utils/utils");
class CairoStubProcessor extends mapper_1.ASTMapper {
    visitFunctionDefinition(node, _ast) {
        if (!isCairoStub(node))
            return;
        let documentation = getDocString(node.documentation);
        (0, assert_1.default)(documentation !== undefined);
        documentation = processDecoratorTags(documentation);
        documentation = processStateVarTags(documentation, node);
        documentation = processInternalFunctionTag(documentation, node);
        documentation = processCurrentFunctionTag(documentation, node);
        setDocString(node, documentation);
    }
}
exports.CairoStubProcessor = CairoStubProcessor;
function processDecoratorTags(documentation) {
    return processMacro(documentation, /DECORATOR\((.*?)\)/g, (s) => `@${s}`);
}
function processStateVarTags(documentation, node) {
    const contract = node.getClosestParentByType(cairoNodes_1.CairoContract);
    const errorNode = node.documentation instanceof solc_typed_ast_1.ASTNode ? node.documentation : node;
    if (contract === undefined) {
        throw new errors_1.WillNotSupportError(`Cairo stub macro 'STATEVAR' is only allowed in member functions`, errorNode);
    }
    return processMacro(documentation, /STATEVAR\((.*?)\)/g, (arg) => {
        const stateVarNames = contract.vStateVariables.map((decl) => decl.name);
        const matchingStateVars = stateVarNames.filter((name) => {
            const regex = new RegExp(`${nameModifiers_1.MANGLED_WARP}[0-9]+_`);
            return name.replace(regex, '') === arg;
        });
        if (matchingStateVars.length === 0) {
            throw new errors_1.TranspilationAbandonedError(`Unable to find matching statevar ${arg}`, errorNode);
        }
        else if (matchingStateVars.length === 1) {
            if ((0, utils_1.isExternallyVisible)(node)) {
                const contract = node.getClosestParentByType(cairoNodes_1.CairoContract);
                if (contract !== undefined) {
                    return `${contract.name}.${matchingStateVars[0]}`;
                }
            }
            return matchingStateVars[0];
        }
        else {
            throw new errors_1.TranspileFailedError(`Unable to pick between multiple state vars matching ${arg}`, errorNode);
        }
    });
}
function processInternalFunctionTag(documentation, node) {
    const contract = node.getClosestParentByType(cairoNodes_1.CairoContract);
    const errorNode = node.documentation instanceof solc_typed_ast_1.ASTNode ? node.documentation : node;
    if (contract === undefined) {
        throw new errors_1.WillNotSupportError(`Cairo stub macro 'INTERNALFUNC' is only allowed in member function definitions`, errorNode);
    }
    return processMacro(documentation, /INTERNALFUNC\((.*?)\)/g, (arg) => {
        const funcNames = contract.vFunctions.filter((f) => !(0, utils_1.isExternallyVisible)(f)).map((f) => f.name);
        const matchingFuncs = funcNames.filter((name) => {
            const regex = new RegExp(`_[0-9a-z]+$`);
            return name.replace(regex, '') === arg;
        });
        if (matchingFuncs.length === 0) {
            throw new errors_1.TranspilationAbandonedError(`Unable to find matching internal function ${arg}`, errorNode);
        }
        else if (matchingFuncs.length === 1) {
            return matchingFuncs[0];
        }
        else {
            throw new errors_1.TranspileFailedError(`Unable to pick between multiple internal functions matching ${arg}`, errorNode);
        }
    });
}
function processCurrentFunctionTag(documentation, node) {
    const contract = node.getClosestParentByType(cairoNodes_1.CairoContract);
    const errorNode = node.documentation instanceof solc_typed_ast_1.ASTNode ? node.documentation : node;
    if (contract === undefined) {
        throw new errors_1.WillNotSupportError(`Cairo stub macro 'CURRENTFUNC' is only allowed in member function definitions`, errorNode);
    }
    return processMacro(documentation, /CURRENTFUNC\((.*?)\)/g, (arg) => {
        if (arg !== '') {
            throw new errors_1.TranspileFailedError(`CURRENTFUNC macro must take no arguments, "${arg}" was provided`);
        }
        return node.name;
    });
}
function processMacro(documentation, regex, func) {
    const macros = [...documentation.matchAll(regex)];
    return macros.reduce((docString, matchArr) => {
        const fullMacro = matchArr[0];
        const argument = matchArr[1];
        return docString.replace(fullMacro, func(argument));
    }, documentation);
}
function setDocString(node, docString) {
    const existingDoc = node.documentation;
    if (existingDoc instanceof solc_typed_ast_1.StructuredDocumentation) {
        existingDoc.text = docString;
    }
    else {
        node.documentation = docString;
    }
}
function getDocString(doc) {
    if (doc === undefined)
        return undefined;
    if (typeof doc === 'string')
        return doc;
    return doc.text;
}
exports.getDocString = getDocString;
function isCairoStub(node) {
    const documentation = getDocString(node.documentation);
    return documentation !== undefined && documentation.split('\n')[0]?.trim() === 'warp-cairo';
}
exports.isCairoStub = isCairoStub;
//# sourceMappingURL=cairoStubProcessor.js.map