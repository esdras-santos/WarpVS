"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyseSol = void 0;
const io_1 = require("../io");
const solCompile_1 = require("../solCompile");
const astPrinter_1 = require("./astPrinter");
function analyseSol(file, options) {
    if (!(0, io_1.isValidSolFile)(file)) {
        console.log(`${file} is not a valid solidity file`);
    }
    astPrinter_1.DefaultASTPrinter.applyOptions(options);
    (0, solCompile_1.compileSolFiles)([file], { warnings: true }).roots.forEach((root) => {
        console.log(`---${root.absolutePath}---`);
        console.log(astPrinter_1.DefaultASTPrinter.print(root));
    });
}
exports.analyseSol = analyseSol;
//# sourceMappingURL=analyseSol.js.map