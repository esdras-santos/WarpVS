"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uint256TransformStructs = exports.typeToStructMapping = exports.getStructDependencyGraph = exports.getAllStructsFromABI = exports.getStructsFromABI = void 0;
const util_1 = require("./util");
const genCairo_1 = require("../genCairo");
function copyStructItem(struct) {
    return {
        type: 'struct',
        name: struct.name,
        size: struct.size,
        members: struct.members.map((member) => {
            return { name: member.name, offset: member.offset, type: member.type };
        }),
    };
}
function getStructsFromABI(abi) {
    return abi.filter((item) => item.type === 'struct' && item.name !== 'Uint256');
}
exports.getStructsFromABI = getStructsFromABI;
function getAllStructsFromABI(abi) {
    let result = getStructDependencyGraph(abi);
    const res = (0, genCairo_1.getInteractiveFuncs)(abi, undefined, undefined);
    result = result.concat(res[2]);
    result = result.concat(res[5]);
    return result;
}
exports.getAllStructsFromABI = getAllStructsFromABI;
function visitStructItemNode(node, visitedStructItem, typeToStruct, result) {
    if (visitedStructItem.has(node)) {
        return;
    }
    visitedStructItem.set(node, true);
    for (let i = 0; i < node.members.length; i++) {
        const struct = typeToStruct.get(node.members[i].type);
        if (struct !== undefined) {
            visitStructItemNode(struct, visitedStructItem, typeToStruct, result);
        }
    }
    result.push(node);
}
function getStructDependencyGraph(abi) {
    const visitedStructItem = new Map();
    const typeToStruct = typeToStructMapping(getStructsFromABI(abi));
    const result = [];
    abi.forEach((item) => {
        if (item.type === 'struct' && item.name !== 'Uint256') {
            visitStructItemNode(item, visitedStructItem, typeToStruct, result);
        }
    });
    return result;
}
exports.getStructDependencyGraph = getStructDependencyGraph;
function typeToStructMapping(structs) {
    return new Map(structs.map((s) => [s.name, s]));
}
exports.typeToStructMapping = typeToStructMapping;
function uint256TransformStructs(structDependency) {
    const typeToStruct = typeToStructMapping(structDependency);
    const transformedStructs = [];
    const transformedStructsFuncs = [];
    const structTuplesMap = new Map();
    structDependency.forEach((itm) => {
        const item = copyStructItem(itm);
        const castFunctionBody = [];
        const castReverseFunctionBody = [];
        item.members.forEach((member) => {
            castFunctionBody.push((0, util_1.castStatement)(member.name, `frm.${member.name}`, member.type, typeToStruct, structTuplesMap));
            castReverseFunctionBody.push((0, util_1.reverseCastStatement)(member.name, `frm.${member.name}`, member.type, typeToStruct, structTuplesMap));
            member.type = (0, util_1.transformType)(member.type, typeToStruct, structTuplesMap);
        });
        transformedStructs.push(item);
        transformedStructsFuncs.push([
            `func ${item.name}_cast{syscall_ptr: felt*, range_check_ptr: felt}(frm : ${item.name}_uint256) -> (to : ${item.name}) {`,
            `${genCairo_1.INDENT}alloc_locals;`,
            ...castFunctionBody,
            `${genCairo_1.INDENT}return (${item.name}(${item.members.map((x) => `${x.name}`).join(',')}),);`,
            '}',
            `func ${item.name}_cast_reverse{syscall_ptr: felt*, range_check_ptr: felt}(frm : ${item.name}) -> (to : ${item.name}_uint256) {`,
            `${genCairo_1.INDENT}alloc_locals;`,
            ...castReverseFunctionBody,
            `${genCairo_1.INDENT}return (${item.name}_uint256(${item.members.map((x) => x.name).join(',')}),);`,
            '}',
        ].join('\n'));
        item.name = `${item.name}_uint256`;
    });
    return [transformedStructs, transformedStructsFuncs, structTuplesMap];
}
exports.uint256TransformStructs = uint256TransformStructs;
//# sourceMappingURL=struct.js.map