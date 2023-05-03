"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.externalInputCheckStatement = void 0;
const genCairo_1 = require("./genCairo");
const utils_1 = require("./utils");
function externalInputCheckStatement(input, type, expInpFunctionsMap, typeToStruct, structTuplesMap) {
    if (type === 'Uint256')
        return `${genCairo_1.INDENT}warp_external_input_check_int256(${input});`;
    if (type.endsWith('*')) {
        const funcName = `external_input_check_${(0, utils_1.hashType)(type)}`;
        expInpFunctionsMap.set(type, [
            `func ${funcName}{range_check_ptr : felt}(len: felt, ptr: ${type}) -> (){`,
            `${genCairo_1.INDENT}alloc_locals;`,
            `${genCairo_1.INDENT}if (len == 0){`,
            `${genCairo_1.INDENT}    return ();`,
            `${genCairo_1.INDENT}}`,
            externalInputCheckStatement(`ptr[0]`, type.slice(0, -1), expInpFunctionsMap, typeToStruct, structTuplesMap),
            `${genCairo_1.INDENT}${funcName}(len = len - 1, ptr = ptr + 1);`,
            `${genCairo_1.INDENT}return ();`,
            '}',
        ].join('\n'));
        return `${genCairo_1.INDENT}${funcName}(${input}_len, ${input});`;
    }
    if (typeToStruct?.has(type) || structTuplesMap?.has(type)) {
        const funcName = `external_input_check_${(0, utils_1.hashType)(type)}`;
        const struct = typeToStruct?.get(type) ?? structTuplesMap?.get(type);
        expInpFunctionsMap.set(type, [
            `func ${funcName}{range_check_ptr : felt}(arg: ${type}) -> (){`,
            `${genCairo_1.INDENT}alloc_locals;`,
            ...(struct?.members.map((member) => {
                return externalInputCheckStatement(`arg.${member.name}`, member.type, expInpFunctionsMap, typeToStruct, structTuplesMap);
            }) ?? []),
            `${genCairo_1.INDENT}return ();`,
            '}',
        ].join('\n'));
        return `${genCairo_1.INDENT}${funcName}(${input});`;
    }
    if (type.startsWith('(') && type.endsWith(')')) {
        const subTypes = (0, utils_1.tupleParser)(type);
        if (subTypes.every((subType) => subType === subTypes[0])) {
            const ret = subTypes.map((subType, index) => externalInputCheckStatement(`${input}[${index}]`, subType, expInpFunctionsMap, typeToStruct, structTuplesMap));
            return ret.join('\n');
        }
        throw new Error('Heterogeneous tuples are should be wrapped in a struct');
    }
    if (type !== 'felt')
        throw new Error(`Unknown type for external Input Check: ${type}`);
    return ';';
}
exports.externalInputCheckStatement = externalInputCheckStatement;
//# sourceMappingURL=extInpCheck.js.map