"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashType = exports.tupleParser = exports.reverseCastStatement = exports.castStatement = exports.transformType = exports.stringifyStructs = void 0;
const keccak_1 = __importDefault(require("keccak"));
const genCairo_1 = require("../genCairo");
function stringifyStructs(structs) {
    return structs
        .filter((item) => item.name !== 'Uint256')
        .map((item) => {
        return [
            `struct ${item.name} {`,
            ...item.members.map((member) => {
                return `${genCairo_1.INDENT}${member.name}: ${member.type},`;
            }),
            '}',
        ].join('\n');
    });
}
exports.stringifyStructs = stringifyStructs;
function transformType(type, typeToStruct, structToAdd) {
    type = type.trim();
    if (type === 'felt')
        return 'Uint256';
    if (typeToStruct.has(type))
        return `${type}_uint256`;
    if (type.endsWith('*')) {
        return `${transformType(type.slice(0, -1), typeToStruct, structToAdd)}*`;
    }
    if (type.startsWith('(') && type.endsWith(')')) {
        const subTypes = tupleParser(type);
        if (subTypes.every((subType) => subType === subTypes[0])) {
            const ret = `(${subTypes
                .map((subType) => transformType(subType, typeToStruct, structToAdd))
                .join(',')})`;
            return ret;
        }
        const structName = `struct_${hashType(type)}`;
        if (structToAdd !== undefined) {
            structToAdd.set(type, {
                name: structName,
                type: 'struct',
                members: subTypes.map((subType, index) => ({
                    name: `member_${index}`,
                    type: transformType(subType, typeToStruct, structToAdd),
                })),
            });
        }
        return structName;
    }
    return type;
}
exports.transformType = transformType;
function castStatement(lvar, rvar, type, typeToStruct, addedStruct) {
    type = type.trim();
    if (type === 'felt')
        return `${genCairo_1.INDENT}let (${lvar}) = narrow_safe(${rvar});`;
    if (typeToStruct.has(type))
        return `${genCairo_1.INDENT}let (${lvar}) = ${type}_cast(${rvar});`;
    if (type.endsWith('*')) {
        return `${genCairo_1.INDENT}let ${lvar} = cast(${rvar}, ${type});`;
    }
    if (type.startsWith('(') && type.endsWith(')')) {
        const subTypes = tupleParser(type);
        const castBody = [];
        for (let i = 0; i < subTypes.length; i++) {
            castBody.push(castStatement(`${lvar}_${i}`, addedStruct?.has(type) ? `${rvar}.member_${i}` : `${rvar}[${i}]`, subTypes[i], typeToStruct, addedStruct));
        }
        castBody.push(`${genCairo_1.INDENT}let ${lvar} = (${subTypes.map((_, i) => `${lvar}_${i}`).join(',')});`);
        return castBody.join('\n');
    }
    return `${genCairo_1.INDENT}let ${lvar} = ${rvar};`;
}
exports.castStatement = castStatement;
function reverseCastStatement(lvar, rvar, type, typeToStruct, addedStruct) {
    type = type.trim();
    if (type === 'felt')
        return `${genCairo_1.INDENT}let (${lvar}) = felt_to_uint256(${rvar});`;
    if (typeToStruct.has(type))
        return `${genCairo_1.INDENT}let (${lvar}) = ${type}_cast_reverse(${rvar});`;
    if (type.endsWith('*')) {
        return `${genCairo_1.INDENT}let ${lvar} = cast(${rvar}, ${transformType(type, typeToStruct)});`;
    }
    if (type.startsWith('(') && type.endsWith(')')) {
        const subTypes = tupleParser(type);
        const castBody = [];
        for (let i = 0; i < subTypes.length; i++) {
            castBody.push(reverseCastStatement(`${lvar}_${i}`, `${rvar}[${i}]`, subTypes[i], typeToStruct, addedStruct));
        }
        castBody.push(`${genCairo_1.INDENT}let ${lvar} = ${addedStruct?.has(type) ? `struct_${hashType(type)}` : ``}(${subTypes
            .map((_, i) => `${lvar}_${i}`)
            .join(',')});`);
        return castBody.join('\n');
    }
    return `${genCairo_1.INDENT}let ${lvar} = ${rvar};`;
}
exports.reverseCastStatement = reverseCastStatement;
function tupleParser(tuple) {
    if (tuple.startsWith('(') && tuple.endsWith(')'))
        tuple = tuple.slice(1, -1).trim();
    tuple = tuple + ',';
    const subTypes = [];
    let start = 0;
    let end = 0;
    let count = 0;
    for (let i = 0; i < tuple.length; i++) {
        if (tuple[i] === '(') {
            count++;
        }
        else if (tuple[i] === ')') {
            count--;
        }
        else if (tuple[i] === ',' && count === 0) {
            end = i;
            subTypes.push(tuple.slice(start, end));
            start = i + 1;
        }
    }
    return subTypes.map((subType) => subType.trim());
}
exports.tupleParser = tupleParser;
function hashType(type) {
    // first 4 bytes keccak256 hash of type
    return (0, keccak_1.default)('keccak256').update(type).digest('hex').slice(0, 8);
}
exports.hashType = hashType;
//# sourceMappingURL=util.js.map