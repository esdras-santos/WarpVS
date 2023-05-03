"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialiseReads = void 0;
const cairoTypeSystem_1 = require("../utils/cairoTypeSystem");
const errors_1 = require("../utils/errors");
const importPaths_1 = require("../utils/importPaths");
function serialiseReads(type, readFelt, readId) {
    const packExpression = producePackExpression(type);
    const reads = [];
    const requiredImports = [];
    const packString = packExpression
        .map((elem) => {
        if (elem === Read.Felt) {
            reads.push(readFelt(reads.length));
        }
        else if (elem === Read.Id) {
            reads.push(readId(reads.length));
        }
        else if (elem === Read.Bool) {
            requiredImports.push(importPaths_1.FELT252_INTO_BOOL);
            reads.push(readFelt(reads.length));
            reads.push(`let read${reads.length} = felt252_into_bool(read${reads.length - 1});`);
        }
        else {
            return elem;
        }
        return `read${reads.length - 1}`;
    })
        .join('');
    return [reads, packString, requiredImports];
}
exports.serialiseReads = serialiseReads;
var Read;
(function (Read) {
    Read[Read["Felt"] = 0] = "Felt";
    Read[Read["Id"] = 1] = "Id";
    Read[Read["Bool"] = 2] = "Bool";
})(Read || (Read = {}));
function producePackExpression(type) {
    if (type instanceof cairoTypeSystem_1.WarpLocation)
        return [Read.Id];
    if (type instanceof cairoTypeSystem_1.CairoFelt)
        return [Read.Felt];
    if (type instanceof cairoTypeSystem_1.CairoBool)
        return [Read.Bool];
    if (type instanceof cairoTypeSystem_1.CairoStaticArray) {
        return [
            '(',
            ...Array(type.size)
                .fill([...producePackExpression(type.type), ','])
                .flat(),
            ')',
        ];
    }
    if (type instanceof cairoTypeSystem_1.CairoUint) {
        if (type.fullStringRepresentation === cairoTypeSystem_1.CairoUint256.fullStringRepresentation) {
            return [
                type.toString(),
                '{',
                ...[
                    ['low', new cairoTypeSystem_1.CairoUint(128)],
                    ['high', new cairoTypeSystem_1.CairoUint(128)],
                ]
                    .flatMap(([memberName, memberType]) => [
                    memberName,
                    ':',
                    ...producePackExpression(memberType),
                    ',',
                ])
                    .slice(0, -1),
                '}',
            ];
        }
        return [`core::integer::${type.toString()}_from_felt252(${Read.Felt})`];
    }
    if (type instanceof cairoTypeSystem_1.CairoStruct) {
        return [
            type.name,
            '{',
            ...[...type.members.entries()]
                .flatMap(([memberName, memberType]) => [
                memberName,
                ':',
                ...producePackExpression(memberType),
                ',',
            ])
                .slice(0, -1),
            '}',
        ];
    }
    throw new errors_1.TranspileFailedError(`Attempted to produce pack expression for unexpected cairo type ${type.toString()}`);
}
//# sourceMappingURL=serialisation.js.map