"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinHandler = void 0;
const mapper_1 = require("../../ast/mapper");
const mathsOperationToFunction_1 = require("./mathsOperationToFunction");
const explicitConversionToFunc_1 = require("./explicitConversionToFunc");
const msgSender_1 = require("./msgSender");
const thisKeyword_1 = require("./thisKeyword");
const ecrecover_1 = require("./ecrecover");
const keccak_1 = require("./keccak");
const blockMethods_1 = require("./blockMethods");
class BuiltinHandler extends mapper_1.ASTMapper {
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    static map(ast) {
        ast = msgSender_1.MsgSender.map(ast);
        ast = blockMethods_1.BlockMethods.map(ast);
        ast = ecrecover_1.Ecrecover.map(ast);
        ast = keccak_1.Keccak.map(ast);
        ast = explicitConversionToFunc_1.ExplicitConversionToFunc.map(ast);
        ast = mathsOperationToFunction_1.MathsOperationToFunction.map(ast);
        ast = thisKeyword_1.ThisKeyword.map(ast);
        return ast;
    }
}
exports.BuiltinHandler = BuiltinHandler;
//# sourceMappingURL=index.js.map