"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCallDataDynArrayStructName = exports.CairoUint256 = exports.MemoryLocation = exports.WarpLocation = exports.CairoPointer = exports.CairoStaticArray = exports.CairoDynArray = exports.CairoStruct = exports.CairoContractAddress = exports.CairoUint = exports.CairoBool = exports.CairoFelt = exports.CairoType = exports.TypeConversionContext = void 0;
const assert_1 = __importDefault(require("assert"));
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("./astPrinter");
const errors_1 = require("./errors");
const nodeTypeProcessing_1 = require("./nodeTypeProcessing");
const utils_1 = require("./utils");
var TypeConversionContext;
(function (TypeConversionContext) {
    TypeConversionContext[TypeConversionContext["MemoryAllocation"] = 0] = "MemoryAllocation";
    TypeConversionContext[TypeConversionContext["Ref"] = 1] = "Ref";
    TypeConversionContext[TypeConversionContext["StorageAllocation"] = 2] = "StorageAllocation";
    TypeConversionContext[TypeConversionContext["CallDataRef"] = 3] = "CallDataRef";
})(TypeConversionContext = exports.TypeConversionContext || (exports.TypeConversionContext = {}));
class CairoType {
    get typeName() {
        return this.toString();
    }
    static fromSol(tp, ast, context = TypeConversionContext.Ref) {
        if (tp instanceof solc_typed_ast_1.AddressType) {
            return new CairoContractAddress();
        }
        else if (tp instanceof solc_typed_ast_1.ArrayType) {
            if (tp.size === undefined) {
                if (context === TypeConversionContext.CallDataRef) {
                    return new CairoDynArray(generateCallDataDynArrayStructName(tp.elementT, ast), CairoType.fromSol(tp.elementT, ast, context));
                }
                else if (context === TypeConversionContext.Ref) {
                    return new MemoryLocation();
                }
                return new WarpLocation();
            }
            else if (context === TypeConversionContext.Ref) {
                return new MemoryLocation();
            }
            else {
                const recursionContext = context === TypeConversionContext.MemoryAllocation ? TypeConversionContext.Ref : context;
                const elementType = CairoType.fromSol(tp.elementT, ast, recursionContext);
                const narrowedLength = (0, utils_1.narrowBigIntSafe)(tp.size, `Arrays of very large size (${tp.size.toString()}) are not supported`);
                return new CairoStaticArray(elementType, narrowedLength);
            }
        }
        else if (tp instanceof solc_typed_ast_1.BoolType) {
            return new CairoBool();
        }
        else if (tp instanceof solc_typed_ast_1.BuiltinType) {
            throw new errors_1.NotSupportedYetError('Serialising BuiltinType not supported yet');
        }
        else if (tp instanceof solc_typed_ast_1.BuiltinStructType) {
            throw new errors_1.NotSupportedYetError('Serialising BuiltinStructType not supported yet');
        }
        else if (tp instanceof solc_typed_ast_1.BytesType || tp instanceof solc_typed_ast_1.StringType) {
            switch (context) {
                case TypeConversionContext.CallDataRef:
                    return new CairoDynArray(generateCallDataDynArrayStructName(new solc_typed_ast_1.FixedBytesType(1), ast), new CairoFelt());
                case TypeConversionContext.Ref:
                    return new MemoryLocation();
                default:
                    return new WarpLocation();
            }
        }
        else if (tp instanceof solc_typed_ast_1.FixedBytesType) {
            return new CairoUint(tp.size * 8);
        }
        else if (tp instanceof solc_typed_ast_1.FunctionType) {
            throw new errors_1.NotSupportedYetError('Serialising FunctionType not supported yet');
        }
        else if (tp instanceof solc_typed_ast_1.IntType) {
            return new CairoUint(tp.nBits);
        }
        else if (tp instanceof solc_typed_ast_1.MappingType) {
            return new WarpLocation();
        }
        else if (tp instanceof solc_typed_ast_1.PointerType) {
            if (context !== TypeConversionContext.Ref) {
                return CairoType.fromSol(tp.to, ast, context);
            }
            return new MemoryLocation();
        }
        else if (tp instanceof solc_typed_ast_1.UserDefinedType) {
            const specificType = tp.definition.type;
            if (tp.definition instanceof solc_typed_ast_1.EnumDefinition) {
                return CairoType.fromSol((0, solc_typed_ast_1.enumToIntType)(tp.definition), ast);
            }
            else if (tp.definition instanceof solc_typed_ast_1.StructDefinition) {
                if (context === TypeConversionContext.Ref) {
                    return new MemoryLocation();
                }
                else if (context === TypeConversionContext.MemoryAllocation) {
                    return new CairoStruct((0, utils_1.mangleStructName)(tp.definition), new Map(tp.definition.vMembers.map((decl) => [
                        decl.name,
                        CairoType.fromSol((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference), ast, TypeConversionContext.Ref),
                    ])));
                }
                else {
                    return new CairoStruct((0, utils_1.mangleStructName)(tp.definition), new Map(tp.definition.vMembers.map((decl) => [
                        decl.name,
                        CairoType.fromSol((0, nodeTypeProcessing_1.safeGetNodeType)(decl, ast.inference), ast, context),
                    ])));
                }
            }
            else if (tp.definition instanceof solc_typed_ast_1.ContractDefinition) {
                return new CairoFelt();
            }
            else if (tp.definition instanceof solc_typed_ast_1.UserDefinedValueTypeDefinition) {
                return CairoType.fromSol((0, nodeTypeProcessing_1.safeGetNodeType)(tp.definition.underlyingType, ast.inference), ast, context);
            }
            throw new errors_1.TranspileFailedError(`Failed to analyse user defined ${specificType} type as cairo type}`);
        }
        else {
            throw new Error(`Don't know how to convert type ${(0, astPrinter_1.printTypeNode)(tp)}`);
        }
    }
}
exports.CairoType = CairoType;
class CairoFelt extends CairoType {
    get fullStringRepresentation() {
        return '[Felt252]';
    }
    toString() {
        return 'felt252';
    }
    get width() {
        return 1;
    }
    serialiseMembers(name) {
        return [name];
    }
}
exports.CairoFelt = CairoFelt;
class CairoBool extends CairoType {
    get fullStringRepresentation() {
        return '[Bool]';
    }
    toString() {
        return 'bool';
    }
    get width() {
        return 1;
    }
    serialiseMembers(name) {
        return [name];
    }
}
exports.CairoBool = CairoBool;
class CairoUint extends CairoType {
    constructor(nBits = 256) {
        super();
        this.nBits = nBits;
    }
    get fullStringRepresentation() {
        return `[u${this.nBits}]`;
    }
    toString() {
        return `u${this.nBits}`;
    }
    get width() {
        if (this.nBits === 256)
            return 2;
        return 1;
    }
    serialiseMembers(name) {
        if (this.nBits === 256)
            return [`${name}.low`, `${name}.high`];
        return [name];
    }
}
exports.CairoUint = CairoUint;
class CairoContractAddress extends CairoType {
    get fullStringRepresentation() {
        return '[ContractAddress]';
    }
    toString() {
        return 'ContractAddress';
    }
    get width() {
        return 1;
    }
    serialiseMembers(name) {
        return [name];
    }
}
exports.CairoContractAddress = CairoContractAddress;
class CairoStruct extends CairoType {
    constructor(name, members) {
        super();
        this.name = name;
        this.members = members;
    }
    get fullStringRepresentation() {
        return `[Struct ${this.name}]${[...this.members.entries()].map(([name, type]) => `(${name}: ${type.fullStringRepresentation}),`)}`;
    }
    toString() {
        return this.name;
    }
    get width() {
        return [...this.members.values()].reduce((acc, t) => acc + t.width, 0);
    }
    serialiseMembers(name) {
        return [...this.members.entries()].flatMap(([memberName, type]) => type.serialiseMembers(`${name}.${memberName}`));
    }
    offsetOf(memberName) {
        let offset = 0;
        for (const [name, type] of this.members) {
            if (name === memberName)
                return offset;
            offset += type.width;
        }
        throw new errors_1.TranspileFailedError(`Attempted to find offset of non-existant member ${memberName} in ${this.name}`);
    }
}
exports.CairoStruct = CairoStruct;
class CairoDynArray extends CairoStruct {
    constructor(name, ptr_member) {
        super(name, new Map([
            ['len', new CairoFelt()],
            ['ptr', new CairoPointer(ptr_member)],
        ]));
        this.name = name;
        this.ptr_member = ptr_member;
    }
    get vPtr() {
        const ptr_member = this.members.get('ptr');
        (0, assert_1.default)(ptr_member instanceof CairoPointer);
        return ptr_member;
    }
    get vLen() {
        const len_member = this.members.get('len');
        (0, assert_1.default)(len_member instanceof CairoFelt);
        return len_member;
    }
}
exports.CairoDynArray = CairoDynArray;
class CairoStaticArray extends CairoType {
    constructor(type, size) {
        super();
        this.type = type;
        this.size = size;
    }
    get fullStringRepresentation() {
        return `[StaticArray][${this.size}][${this.type.fullStringRepresentation}]`;
    }
    toString() {
        return (`(${this.type.toString()}` + `${`, ` + this.type.toString()}`.repeat(this.size - 1) + `)`);
    }
    get typeName() {
        return `${this.type.typeName}` + `${`x` + this.type.typeName}`.repeat(this.size - 1);
    }
    get width() {
        return this.type.width * this.size;
    }
    serialiseMembers(name) {
        return (0, utils_1.mapRange)(this.size, (n) => this.type.serialiseMembers(`${name}[${n}]`)).flat();
    }
}
exports.CairoStaticArray = CairoStaticArray;
class CairoPointer extends CairoType {
    constructor(to) {
        super();
        this.to = to;
    }
    get fullStringRepresentation() {
        return `[Pointer](${this.to.fullStringRepresentation})`;
    }
    toString() {
        return `${this.to.toString()}*`;
    }
    get width() {
        return 1;
    }
    serialiseMembers(name) {
        return [name];
    }
}
exports.CairoPointer = CairoPointer;
class WarpLocation extends CairoFelt {
    get typeName() {
        return 'warp_id';
    }
    get fullStringRepresentation() {
        return `[Id]`;
    }
}
exports.WarpLocation = WarpLocation;
class MemoryLocation extends CairoFelt {
}
exports.MemoryLocation = MemoryLocation;
exports.CairoUint256 = new CairoUint(256);
const cd_dynarray_prefix = 'cd_dynarray_';
function generateCallDataDynArrayStructName(elementType, ast) {
    return `${cd_dynarray_prefix}${generateCallDataDynArrayStructNameInner(elementType, ast)}`;
}
exports.generateCallDataDynArrayStructName = generateCallDataDynArrayStructName;
function generateCallDataDynArrayStructNameInner(elementType, ast) {
    if (elementType instanceof solc_typed_ast_1.PointerType) {
        return generateCallDataDynArrayStructNameInner(elementType.to, ast);
    }
    else if (elementType instanceof solc_typed_ast_1.ArrayType) {
        if (elementType.size !== undefined) {
            return `arr_${(0, utils_1.narrowBigIntSafe)(elementType.size)}_${generateCallDataDynArrayStructNameInner(elementType.elementT, ast)}`;
        }
        else {
            // This is included only for completeness. Starknet does not currently allow dynarrays of dynarrays to be passed
            return `arr_d_${generateCallDataDynArrayStructNameInner(elementType.elementT, ast)}`;
        }
    }
    else if (elementType instanceof solc_typed_ast_1.BytesType) {
        return `arr_d_felt`;
    }
    else if (elementType instanceof solc_typed_ast_1.UserDefinedType &&
        elementType.definition instanceof solc_typed_ast_1.StructDefinition) {
        return (0, utils_1.mangleStructName)(elementType.definition);
    }
    else {
        return CairoType.fromSol(elementType, ast, TypeConversionContext.CallDataRef).toString();
    }
}
//# sourceMappingURL=cairoTypeSystem.js.map