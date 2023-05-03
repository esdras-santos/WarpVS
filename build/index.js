"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as path from 'path';
// import { outputResult } from "./io";
// import { compileSolFiles } from "./solCompile";
// import { handleTranspilationError, transpile } from "./transpiler";
const export_1 = require("./export");
function transpileFile(pathToFile) {
    const dirPath = pathToFile.split('/');
    let aux = dirPath;
    aux[aux.length - 1] = 'warpvs-output';
    const outputDir = aux;
    const options = {
        dev: false,
        outputDir: outputDir.join('/'),
        debugInfo: false,
        stubs: true,
        strict: true,
        warnings: false,
        compileCairo: false,
        formatCairo: true
    };
    (0, export_1.runTranspile)([pathToFile], options);
}
transpileFile(process.argv[2]);
//# sourceMappingURL=index.js.map