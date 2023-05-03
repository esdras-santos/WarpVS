"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVenvSetup = void 0;
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const errors_1 = require("./errors");
function runVenvSetup(options) {
    try {
        const warpVenv = path.resolve(__dirname, '..', '..', 'warp_venv.sh');
        (0, child_process_1.execSync)(`${warpVenv} ${options.python}`, { stdio: options.verbose ? 'inherit' : 'pipe' });
    }
    catch {
        (0, errors_1.logError)('Try using --python option for warp install and specify the path to python3.9 e.g "warp install --python /usr/bin/python3.9"');
    }
}
exports.runVenvSetup = runVenvSetup;
//# sourceMappingURL=setupVenv.js.map