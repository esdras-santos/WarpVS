"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageWriteGen = void 0;
const endent_1 = __importDefault(require("endent"));
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const cloning_1 = require("../../utils/cloning");
const functionGeneration_1 = require("../../utils/functionGeneration");
const importPaths_1 = require("../../utils/importPaths");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
const uNselector_1 = require("../utils/uNselector");
class StorageWriteGen extends base_1.StringIndexedFuncGen {
    gen(storageLocation, writeValue) {
        const typeToWrite = (0, nodeTypeProcessing_1.safeGetNodeType)(storageLocation, this.ast.inference);
        const funcDef = this.getOrCreateFuncDef(typeToWrite);
        return (0, functionGeneration_1.createCallToFunction)(funcDef, [storageLocation, writeValue], this.ast);
    }
    getOrCreateFuncDef(typeToWrite) {
        const key = typeToWrite.pp();
        const value = this.generatedFunctionsDef.get(key);
        if (value !== undefined) {
            return value;
        }
        const funcInfo = this.getOrCreate(typeToWrite);
        const argTypeName = (0, utils_1.typeNameFromTypeNode)(typeToWrite, this.ast);
        const funcDef = (0, functionGeneration_1.createCairoGeneratedFunction)(funcInfo, [
            ['loc', argTypeName, solc_typed_ast_1.DataLocation.Storage],
            [
                'value',
                (0, cloning_1.cloneASTNode)(argTypeName, this.ast),
                typeToWrite instanceof solc_typed_ast_1.PointerType ? solc_typed_ast_1.DataLocation.Storage : solc_typed_ast_1.DataLocation.Default,
            ],
        ], [
            [
                'res',
                (0, cloning_1.cloneASTNode)(argTypeName, this.ast),
                typeToWrite instanceof solc_typed_ast_1.PointerType ? solc_typed_ast_1.DataLocation.Storage : solc_typed_ast_1.DataLocation.Default,
            ],
        ], this.ast, this.sourceUnit);
        this.generatedFunctionsDef.set(key, funcDef);
        return funcDef;
    }
    getOrCreate(typeToWrite) {
        const functionsCalled = [];
        const cairoTypeToWrite = cairoTypeSystem_1.CairoType.fromSol(typeToWrite, this.ast, cairoTypeSystem_1.TypeConversionContext.StorageAllocation);
        const cairoTypeString = cairoTypeToWrite.toString();
        const writeCode = cairoTypeToWrite
            .serialiseMembers('value')
            .map((name, index) => {
            if (cairoTypeToWrite instanceof cairoTypeSystem_1.CairoBool) {
                functionsCalled.push(this.requireImport(...importPaths_1.BOOL_INTO_FELT252));
                return (0, endent_1.default) `
            let intEncoded${index} = bool_into_felt252(${name});
            ${write((0, base_1.add)('loc', index), `intEncoded${index}`)}
          `;
            }
            if (cairoTypeToWrite.fullStringRepresentation === cairoTypeSystem_1.CairoUint256.fullStringRepresentation) {
                functionsCalled.push(this.requireImport(...importPaths_1.U128_TO_FELT));
                name = `u128_to_felt252(${name})`;
            }
            else if (cairoTypeToWrite instanceof cairoTypeSystem_1.CairoUint) {
                name = `${cairoTypeString}_to_felt252(${name})`;
                functionsCalled.push(this.requireImport(...(0, uNselector_1.toFeltfromuXImport)(cairoTypeToWrite)));
            }
            return `  ${write((0, base_1.add)('loc', index), name)}`;
        })
            .join('\n');
        const funcName = `WS${this.generatedFunctionsDef.size}_WRITE_${cairoTypeToWrite.typeName}`;
        const funcInfo = {
            name: funcName,
            code: (0, endent_1.default) `
        fn ${funcName}(loc: felt252, value: ${cairoTypeString}) -> ${cairoTypeString}{
          ${writeCode}
          return value;
        }
      `,
            functionsCalled: functionsCalled,
        };
        return funcInfo;
    }
}
exports.StorageWriteGen = StorageWriteGen;
function write(offset, value) {
    return `WARP_STORAGE::write(${offset}, ${value});`;
}
//# sourceMappingURL=storageWrite.js.map