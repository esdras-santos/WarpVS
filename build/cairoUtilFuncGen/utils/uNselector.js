"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeltfromuXImport = exports.toFeltfromuXImport = void 0;
const importPaths_1 = require("../../utils/importPaths");
const toFeltfromuXImport = (uNtype) => {
    switch (uNtype.toString()) {
        case 'u8':
            return importPaths_1.U8_TO_FELT;
        case 'u16':
            return importPaths_1.U16_TO_FELT;
        case 'u24':
            return importPaths_1.U24_TO_FELT;
        case 'u32':
            return importPaths_1.U32_TO_FELT;
        case 'u40':
            return importPaths_1.U40_TO_FELT;
        case 'u48':
            return importPaths_1.U48_TO_FELT;
        case 'u56':
            return importPaths_1.U56_TO_FELT;
        case 'u64':
            return importPaths_1.U64_TO_FELT;
        case 'u72':
            return importPaths_1.U72_TO_FELT;
        case 'u80':
            return importPaths_1.U80_TO_FELT;
        case 'u88':
            return importPaths_1.U88_TO_FELT;
        case 'u96':
            return importPaths_1.U96_TO_FELT;
        case 'u104':
            return importPaths_1.U104_TO_FELT;
        case 'u112':
            return importPaths_1.U112_TO_FELT;
        case 'u120':
            return importPaths_1.U120_TO_FELT;
        case 'u128':
            return importPaths_1.U128_TO_FELT;
        case 'u136':
            return importPaths_1.U136_TO_FELT;
        case 'u144':
            return importPaths_1.U144_TO_FELT;
        case 'u152':
            return importPaths_1.U152_TO_FELT;
        case 'u160':
            return importPaths_1.U160_TO_FELT;
        case 'u168':
            return importPaths_1.U168_TO_FELT;
        case 'u176':
            return importPaths_1.U176_TO_FELT;
        case 'u184':
            return importPaths_1.U184_TO_FELT;
        case 'u192':
            return importPaths_1.U192_TO_FELT;
        case 'u200':
            return importPaths_1.U200_TO_FELT;
        case 'u208':
            return importPaths_1.U208_TO_FELT;
        case 'u216':
            return importPaths_1.U216_TO_FELT;
        case 'u224':
            return importPaths_1.U224_TO_FELT;
        case 'u232':
            return importPaths_1.U232_TO_FELT;
        case 'u240':
            return importPaths_1.U240_TO_FELT;
        case 'u248':
            return importPaths_1.U248_TO_FELT;
        default:
            throw new Error('Invalid CairoUint type');
    }
};
exports.toFeltfromuXImport = toFeltfromuXImport;
const getFeltfromuXImport = (uNtype) => {
    switch (uNtype.toString()) {
        case 'u8':
            return importPaths_1.U8_FROM_FELT;
        case 'u16':
            return importPaths_1.U16_FROM_FELT;
        case 'u24':
            return importPaths_1.U24_FROM_FELT;
        case 'u32':
            return importPaths_1.U32_FROM_FELT;
        case 'u40':
            return importPaths_1.U40_FROM_FELT;
        case 'u48':
            return importPaths_1.U48_FROM_FELT;
        case 'u56':
            return importPaths_1.U56_FROM_FELT;
        case 'u64':
            return importPaths_1.U64_FROM_FELT;
        case 'u72':
            return importPaths_1.U72_FROM_FELT;
        case 'u80':
            return importPaths_1.U80_FROM_FELT;
        case 'u88':
            return importPaths_1.U88_FROM_FELT;
        case 'u96':
            return importPaths_1.U96_FROM_FELT;
        case 'u104':
            return importPaths_1.U104_FROM_FELT;
        case 'u112':
            return importPaths_1.U112_FROM_FELT;
        case 'u120':
            return importPaths_1.U120_FROM_FELT;
        case 'u128':
            return importPaths_1.U128_FROM_FELT;
        case 'u136':
            return importPaths_1.U136_FROM_FELT;
        case 'u144':
            return importPaths_1.U144_FROM_FELT;
        case 'u152':
            return importPaths_1.U152_FROM_FELT;
        case 'u160':
            return importPaths_1.U160_FROM_FELT;
        case 'u168':
            return importPaths_1.U168_FROM_FELT;
        case 'u176':
            return importPaths_1.U176_FROM_FELT;
        case 'u184':
            return importPaths_1.U184_FROM_FELT;
        case 'u192':
            return importPaths_1.U192_FROM_FELT;
        case 'u200':
            return importPaths_1.U200_FROM_FELT;
        case 'u208':
            return importPaths_1.U208_FROM_FELT;
        case 'u216':
            return importPaths_1.U216_FROM_FELT;
        case 'u224':
            return importPaths_1.U224_FROM_FELT;
        case 'u232':
            return importPaths_1.U232_FROM_FELT;
        case 'u240':
            return importPaths_1.U240_FROM_FELT;
        case 'u248':
            return importPaths_1.U248_FROM_FELT;
        default:
            throw new Error('Invalid CairoUint type');
    }
};
exports.getFeltfromuXImport = getFeltfromuXImport;
//# sourceMappingURL=uNselector.js.map