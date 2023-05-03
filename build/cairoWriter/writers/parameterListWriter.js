"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterListWriter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoTypeSystem_1 = require("../../utils/cairoTypeSystem");
const nodeTypeProcessing_1 = require("../../utils/nodeTypeProcessing");
const utils_1 = require("../../utils/utils");
const base_1 = require("../base");
class ParameterListWriter extends base_1.CairoASTNodeWriter {
    writeInner(node, _writer) {
        const defContext = node.parent instanceof solc_typed_ast_1.FunctionDefinition && (0, utils_1.isExternallyVisible)(node.parent)
            ? cairoTypeSystem_1.TypeConversionContext.CallDataRef
            : cairoTypeSystem_1.TypeConversionContext.Ref;
        const params = node.vParameters.map((value) => {
            const varTypeConversionContext = value.storageLocation === solc_typed_ast_1.DataLocation.CallData
                ? cairoTypeSystem_1.TypeConversionContext.CallDataRef
                : defContext;
            const tp = cairoTypeSystem_1.CairoType.fromSol((0, nodeTypeProcessing_1.safeGetNodeType)(value, this.ast.inference), this.ast, varTypeConversionContext);
            const isReturnParamList = node.parent instanceof solc_typed_ast_1.FunctionDefinition && node.parent.vReturnParameters === node;
            // TODO: In the position of the type is written the typeString of the var. Needs to be checked the transformation
            // of that typestring into de Cairo 1 syntax for that type (Eg: dynamic arrays of some variable)
            return isReturnParamList ? tp : `${value.name} : ${tp}`;
        });
        return [params.join(', ')];
    }
}
exports.ParameterListWriter = ParameterListWriter;
//# sourceMappingURL=parameterListWriter.js.map