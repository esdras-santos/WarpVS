"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInteractiveFuncs = exports.genCairoContract = exports.INDENT = void 0;
const extInpCheck_1 = require("./extInpCheck");
const utils_1 = require("./utils");
exports.INDENT = '    ';
function genCairoContract(abi, contract_address, class_hash) {
    const langDirective = getStarknetLangDirective();
    const structs = (0, utils_1.stringifyStructs)((0, utils_1.getStructDependencyGraph)(abi));
    const forwarderInterface = getForwarderInterface(abi);
    const [interactiveFuncs, imports, transformStructs, castFunctions, expInpFunctions, tupleStructs,] = getInteractiveFuncs(abi, contract_address, class_hash);
    return (langDirective.join('\n') +
        '\n\n// imports \n' +
        imports.join('\n') +
        '\n\n// existing structs\n' +
        structs.join('\n') +
        '\n\n// transformed structs \n' +
        (0, utils_1.stringifyStructs)(transformStructs).join('\n') +
        '\n\n// tuple structs \n' +
        (0, utils_1.stringifyStructs)(tupleStructs).join('\n') +
        '\n\n// forwarder interface \n' +
        forwarderInterface.join('\n') +
        '\n\n//cast functions for structs \n' +
        castFunctions.join('\n') +
        '\n\n// external input check functions\n' +
        expInpFunctions.join('\n') +
        '\n\n//funtions to interact with given cairo contract\n' +
        interactiveFuncs.join('\n'));
}
exports.genCairoContract = genCairoContract;
function getStarknetLangDirective() {
    return ['%lang starknet'];
}
function getForwarderInterface(abi) {
    return [
        '@contract_interface',
        'namespace Forwarder {',
        ...abi.map((item) => {
            if (item.type === 'function' && item.name !== '__default__') {
                return [
                    `${exports.INDENT}func ${item.name}(`,
                    ...item.inputs.map((input) => {
                        return `${exports.INDENT}${exports.INDENT}${input.name}: ${input.type},`;
                    }),
                    `${exports.INDENT}) -> (${item.outputs
                        .map((output) => `${output.name}:${output.type}`)
                        .join(', ')}){`,
                    `${exports.INDENT}}`,
                ].join('\n');
            }
            return '';
        }),
        '}',
    ];
}
function getInteractiveFuncs(abi, contract_address, class_hash) {
    const structDependency = (0, utils_1.getStructDependencyGraph)(abi);
    const typeToStruct = (0, utils_1.typeToStructMapping)(structDependency);
    const [transformedStructs, transformedStructsFuncs, structTuplesMap] = (0, utils_1.uint256TransformStructs)(structDependency);
    const imports = [
        'from starkware.cairo.common.uint256 import Uint256',
        'from starkware.cairo.common.cairo_builtins import HashBuiltin',
        'from warplib.maths.utils import felt_to_uint256, narrow_safe',
        'from warplib.maths.external_input_check_ints import warp_external_input_check_int256',
    ];
    const interactiveFuncs = [];
    const expInpFunctionsMap = new Map();
    abi.forEach((item) => {
        if (item.type === 'function' && item.name !== '__default__') {
            const decorator = item.stateMutability === 'view' ? '@view' : '@external';
            const callToFunc = (isDelegate) => `${exports.INDENT}let (${item.outputs.reduce((acc, output) => {
                if (output.type.endsWith('*')) {
                    acc.pop();
                    acc.push(`${output.name}_len`);
                }
                return [...acc, `${output.name}_cast_rev`];
            }, [])}) = Forwarder.${(isDelegate ? 'library_call_' : '') + item.name}(${isDelegate ? class_hash ?? 0 : contract_address ?? 0},${item.inputs.reduce((acc, input) => {
                if (input.type.endsWith('*')) {
                    acc.pop();
                    acc.push(`${input.name}_len`);
                }
                return [...acc, `${input.name}_cast`];
            }, [])});`;
            const funcArgs = item.inputs.reduce((acc, input) => {
                if (input.type.endsWith('*')) {
                    acc.pop();
                    acc.push(`${exports.INDENT}${input.name}_len: felt,`);
                }
                acc.push(`${exports.INDENT}${input.name}: ${(0, utils_1.transformType)(input.type, typeToStruct, structTuplesMap)},`);
                return acc;
            }, []);
            const funcReturnArgs = item.outputs.reduce((acc, output) => {
                if (output.type.endsWith('*')) {
                    acc.pop();
                    acc.push(`${exports.INDENT}${output.name}_len: felt,`);
                }
                acc.push(`${exports.INDENT}${output.name}: ${(0, utils_1.transformType)(output.type, typeToStruct, structTuplesMap)},`);
                return acc;
            }, []);
            const externalInputCheckStatements = item.inputs.reduce((acc, input) => {
                if (input.type.endsWith('*')) {
                    acc.pop();
                }
                acc.push((0, extInpCheck_1.externalInputCheckStatement)(input.name, (0, utils_1.transformType)(input.type, typeToStruct, structTuplesMap), expInpFunctionsMap, (0, utils_1.typeToStructMapping)(transformedStructs), structTuplesMap));
                return acc;
            }, []);
            const inputFeltToUint256CastStatements = item.inputs.reduce((acc, input) => {
                if (input.type.endsWith('*')) {
                    acc.pop();
                }
                acc.push((0, utils_1.castStatement)(input.name + '_cast', input.name, input.type, typeToStruct, structTuplesMap));
                return acc;
            }, []);
            const outputFeltToUint256CastStatements = item.outputs.reduce((acc, output) => {
                if (output.type.endsWith('*')) {
                    acc.pop();
                }
                acc.push((0, utils_1.reverseCastStatement)(output.name, output.name + '_cast_rev', output.type, typeToStruct, structTuplesMap));
                return acc;
            }, []);
            const funcDef = (isDelegate) => [
                decorator,
                `func _ITR_${(isDelegate ? '_delegate_' : '') + item.name} {syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr: felt}(`,
                ...funcArgs,
                ') -> (',
                ...funcReturnArgs,
                ') {',
                `${exports.INDENT}alloc_locals;`,
                `${exports.INDENT}// check external input`,
                ...externalInputCheckStatements,
                `${exports.INDENT}// cast inputs`,
                ...inputFeltToUint256CastStatements,
                `${exports.INDENT}// call cairo contract function`,
                callToFunc(isDelegate),
                `${exports.INDENT}// cast outputs`,
                ...outputFeltToUint256CastStatements,
                `${exports.INDENT}return (${[...item.outputs.map((x) => x.name), ''].join(',')});`,
                '}',
            ];
            interactiveFuncs.push(...funcDef(false), ...funcDef(true));
        }
    });
    return [
        interactiveFuncs,
        imports,
        transformedStructs,
        transformedStructsFuncs,
        [...expInpFunctionsMap.values()],
        [...structTuplesMap.values()],
    ];
}
exports.getInteractiveFuncs = getInteractiveFuncs;
//# sourceMappingURL=genCairo.js.map