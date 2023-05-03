"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejectUnsupportedFeatures = exports.checkPath = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const mapper_1 = require("../ast/mapper");
const astPrinter_1 = require("../utils/astPrinter");
const errors_1 = require("../utils/errors");
const nodeTypeProcessing_1 = require("../utils/nodeTypeProcessing");
const utils_1 = require("../utils/utils");
const PATH_REGEX = /^[\w-@/\\]*$/;
function checkPath(path) {
    const pathWithoutExtension = path.substring(0, path.length - '.sol'.length);
    return !PATH_REGEX.test(pathWithoutExtension);
}
exports.checkPath = checkPath;
class RejectUnsupportedFeatures extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.unsupportedFeatures = [];
    }
    static map(ast) {
        const unsupportedPerSource = new Map();
        const unsupportedDetected = ast.roots.reduce((unsupported, sourceUnit) => {
            const mapper = new this();
            mapper.dispatchVisit(sourceUnit, ast);
            if (mapper.unsupportedFeatures.length > 0) {
                unsupportedPerSource.set(sourceUnit.absolutePath, mapper.unsupportedFeatures);
                return unsupported + mapper.unsupportedFeatures.length;
            }
            return unsupported;
        }, 0);
        if (unsupportedDetected > 0) {
            const errorMsg = (0, errors_1.getErrorMessage)(unsupportedPerSource, `Detected ${unsupportedDetected} Unsupported Features:`);
            throw new errors_1.WillNotSupportError(errorMsg, undefined, false);
        }
        return ast;
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitIndexAccess(node, ast) {
        if (node.vIndexExpression === undefined) {
            if (!((0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference) instanceof solc_typed_ast_1.TypeNameType)) {
                this.addUnsupported(`Undefined index access not supported`, node);
            }
        }
        this.visitExpression(node, ast);
    }
    visitRevertStatement(node, _ast) {
        this.addUnsupported('Reverts with custom errors are not supported', node);
    }
    visitErrorDefinition(node, _ast) {
        this.addUnsupported('User defined Errors are not supported', node);
    }
    visitEventDefinition(node, ast) {
        node.vParameters.vParameters
            .filter((param) => param.indexed)
            .forEach((param) => {
            const paramType = (0, solc_typed_ast_1.generalizeType)((0, nodeTypeProcessing_1.safeGetNodeType)(param, ast.inference))[0];
            if ((0, nodeTypeProcessing_1.isValueType)(paramType)) {
                this.commonVisit(node, ast);
                return;
            }
            if (paramType instanceof solc_typed_ast_1.ArrayType ||
                paramType instanceof solc_typed_ast_1.MappingType ||
                (paramType instanceof solc_typed_ast_1.PointerType && (0, solc_typed_ast_1.isReferenceType)(paramType.to)))
                this.addUnsupported(`Indexed parameters of type: ${paramType.constructor.name} are not supported`, node);
            if (paramType instanceof solc_typed_ast_1.UserDefinedType &&
                paramType.definition instanceof solc_typed_ast_1.StructDefinition)
                this.addUnsupported(`Indexed parameters of type: Structs are not supported`, node);
        });
    }
    visitFunctionCallOptions(node, ast) {
        // Allow options only when passing salt values for contract creation
        if (node.parent instanceof solc_typed_ast_1.FunctionCall &&
            node.parent.typeString.startsWith('contract') &&
            [...node.vOptionsMap.entries()].length === 1 &&
            node.vOptionsMap.has('salt')) {
            return this.visitExpression(node, ast);
        }
        this.addUnsupported('Function call options (other than `salt` when creating a contract), such as {gas:X} and {value:X} are not supported', node);
    }
    visitVariableDeclaration(node, ast) {
        const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node, ast.inference);
        if (typeNode instanceof solc_typed_ast_1.FunctionType)
            this.addUnsupported('Function objects are not supported', node);
        this.commonVisit(node, ast);
    }
    visitExpressionStatement(node, ast) {
        const typeNode = (0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference);
        if (typeNode instanceof solc_typed_ast_1.FunctionType)
            this.addUnsupported('Function objects are not supported', node);
        this.commonVisit(node, ast);
    }
    visitIdentifier(node, _ast) {
        if (node.name === 'msg' && node.vIdentifierType === solc_typed_ast_1.ExternalReferenceType.Builtin) {
            if (!(node.parent instanceof solc_typed_ast_1.MemberAccess && node.parent.memberName === 'sender')) {
                this.addUnsupported(`msg object not supported outside of 'msg.sender'`, node);
            }
        }
        else if (node.name === 'block' && node.vIdentifierType === solc_typed_ast_1.ExternalReferenceType.Builtin) {
            if (node.parent instanceof solc_typed_ast_1.MemberAccess &&
                ['coinbase', 'chainid', 'gaslimit', 'basefee', 'difficulty'].includes(node.parent.memberName)) {
                this.addUnsupported(`block.${node.parent.memberName} not supported`, node);
            }
        }
    }
    visitMemberAccess(node, ast) {
        if (!((0, nodeTypeProcessing_1.safeGetNodeType)(node.vExpression, ast.inference) instanceof solc_typed_ast_1.AddressType)) {
            this.visitExpression(node, ast);
            return;
        }
        const members = [
            'balance',
            'code',
            'codehash',
            'transfer',
            'send',
            'call',
            'delegatecall',
            'staticcall',
        ];
        if (members.includes(node.memberName))
            this.addUnsupported(`Members of addresses are not supported. Found at ${(0, astPrinter_1.printNode)(node)}`, node);
        this.visitExpression(node, ast);
    }
    visitFunctionCall(node, ast) {
        if (node.kind !== solc_typed_ast_1.FunctionCallKind.FunctionCall ||
            node.vFunctionCallType !== solc_typed_ast_1.ExternalReferenceType.Builtin)
            return this.visitExpression(node, ast);
        const funcName = node.vFunctionName;
        if (['sha256', 'ripemd160', 'encodeCall', 'blockhash', 'selfdestruct', 'gasleft'].includes(funcName)) {
            this.addUnsupported(`Solidity builtin ${funcName} is not supported`, node);
        }
        else if (['require', 'assert'].includes(funcName) &&
            node.vArguments.length > 1 &&
            !(node.vArguments[1] instanceof solc_typed_ast_1.Literal)) {
            this.addUnsupported(`Dynamic string cannot be used as arguments for  ${funcName}`, node.vArguments[1]);
        }
        else if (funcName === 'revert' &&
            node.vArguments.length > 0 &&
            !(node.vArguments[0] instanceof solc_typed_ast_1.Literal)) {
            this.addUnsupported(`Dynamic string cannot be used as arguments for  ${funcName}`, node.vArguments[0]);
        }
        this.visitExpression(node, ast);
    }
    visitFunctionDefinition(node, ast) {
        if (!(node.vScope instanceof solc_typed_ast_1.ContractDefinition && node.vScope.kind === solc_typed_ast_1.ContractKind.Library)) {
            [...node.vParameters.vParameters, ...node.vReturnParameters.vParameters].forEach((decl) => {
                const type = (0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference);
                this.functionArgsCheck(type, ast, (0, utils_1.isExternallyVisible)(node), decl.storageLocation, node);
            });
        }
        if (node.kind === solc_typed_ast_1.FunctionKind.Fallback) {
            if (node.vParameters.vParameters.length > 0)
                this.addUnsupported(`${node.kind} with arguments is not supported`, node);
        }
        else if (node.kind === solc_typed_ast_1.FunctionKind.Receive) {
            this.addUnsupported(`Receive functions are not supported`, node);
        }
        //checks for the pattern if "this" keyword is used to call the external functions during the contract construction
        this.checkExternalFunctionCallWithThisOnConstruction(node);
        this.commonVisit(node, ast);
    }
    visitTryStatement(node, _ast) {
        this.addUnsupported(`Try/Catch statements are not supported`, node);
    }
    visitSourceUnit(node, ast) {
        if (checkPath(node.absolutePath)) {
            this.addUnsupported('File path includes unsupported characters, only _, -, /, , and alphanumeric characters are supported', node);
        }
        this.commonVisit(node, ast);
    }
    // Cases not allowed:
    // Dynarray inside structs to/from external functions
    // Dynarray inside dynarray to/from external functions
    // Dynarray as direct child of static array to/from external functions
    functionArgsCheck(type, ast, externallyVisible, dataLocation, node) {
        if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
            if (externallyVisible && findDynArrayRecursive(type, ast)) {
                this.addUnsupported(`Dynamic arrays are not allowed as (indirect) children of structs passed to/from external functions`, node);
                return;
            }
            type.definition.vMembers.forEach((member) => this.functionArgsCheck((0, nodeTypeProcessing_1.safeGetNodeType)(member, ast.inference), ast, externallyVisible, dataLocation, member));
        }
        else if (type instanceof solc_typed_ast_1.ArrayType && type.size === undefined) {
            if (externallyVisible && findDynArrayRecursive(type.elementT, ast)) {
                this.addUnsupported(`Dynamic arrays are not allowed as (indirect) children of dynamic arrays passed to/from external functions`, node);
                return;
            }
            this.functionArgsCheck(type.elementT, ast, externallyVisible, dataLocation, node);
        }
        else if (type instanceof solc_typed_ast_1.ArrayType) {
            if ((0, nodeTypeProcessing_1.isDynamicArray)(type.elementT)) {
                this.addUnsupported(`Dynamic arrays are not allowed as children of static arrays passed to/from external functions`, node);
                return;
            }
            this.functionArgsCheck(type.elementT, ast, externallyVisible, dataLocation, node);
        }
    }
    // Checking that if the function definition is constructor then there is no usage of
    // the `this` keyword for calling any contract function
    checkExternalFunctionCallWithThisOnConstruction(node) {
        if (node.kind === solc_typed_ast_1.FunctionKind.Constructor) {
            const nodesWithThisIdentifier = node.vBody
                ?.getChildren()
                .filter((childNode, _) => childNode instanceof solc_typed_ast_1.Identifier && childNode.name === 'this');
            nodesWithThisIdentifier?.forEach((identifierNode) => {
                const parentNode = identifierNode?.parent;
                if (parentNode instanceof solc_typed_ast_1.MemberAccess &&
                    parentNode?.parent instanceof solc_typed_ast_1.FunctionCall &&
                    (0, utils_1.isExternalCall)(parentNode.parent)) {
                    this.addUnsupported(`External function calls using "this" keyword are not supported in contract's constructor function`, node);
                }
            });
        }
    }
    addUnsupported(message, node) {
        this.unsupportedFeatures.push([message, node]);
    }
}
exports.RejectUnsupportedFeatures = RejectUnsupportedFeatures;
// Returns whether the given type is a dynamic array, or contains one
function findDynArrayRecursive(type, ast) {
    if ((0, nodeTypeProcessing_1.isDynamicArray)(type))
        return true;
    if (type instanceof solc_typed_ast_1.PointerType) {
        return findDynArrayRecursive(type.to, ast);
    }
    else if (type instanceof solc_typed_ast_1.ArrayType) {
        return findDynArrayRecursive(type.elementT, ast);
    }
    else if (type instanceof solc_typed_ast_1.BytesType) {
        return true;
    }
    else if (type instanceof solc_typed_ast_1.UserDefinedType && type.definition instanceof solc_typed_ast_1.StructDefinition) {
        return type.definition.vMembers.some((member) => findDynArrayRecursive((0, nodeTypeProcessing_1.safeGetNodeType)(member, ast.inference), ast));
    }
    else {
        return false;
    }
}
//# sourceMappingURL=rejectUnsupportedFeatures.js.map