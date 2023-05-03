"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warplibImportInfo = void 0;
const fs_1 = __importDefault(require("fs"));
const cairoParsing_1 = require("../utils/cairoParsing");
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
exports.warplibImportInfo = glob_1.glob
    .sync('warplib/src/**/*.cairo')
    .reduce((warplibMap, pathToFile) => {
    const rawCairoCode = fs_1.default.readFileSync(pathToFile, { encoding: 'utf8' });
    // TODO: Add encodePath here. Importing encodePath cause circular
    // dependency error. Suggested solution is to relocate the import files
    const importPath = [
        'warplib',
        ...pathToFile.slice('warplib/src/'.length, -'.cairo'.length).split(path_1.default.sep),
    ].join('/');
    const fileMap = warplibMap.get(importPath) ?? new Map();
    if (!warplibMap.has(importPath)) {
        warplibMap.set(importPath, fileMap);
    }
    (0, cairoParsing_1.parseMultipleRawCairoFunctions)(rawCairoCode).forEach((cairoFunc) => fileMap.set(cairoFunc.name, cairoFunc.implicits));
    return warplibMap;
}, new Map());
//# sourceMappingURL=gatherWarplibImports.js.map