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
exports.fullVersionFromMajor = exports.nethersolcPath = exports.getPlatform = void 0;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const errors_1 = require("./utils/errors");
function getPlatform() {
    const platform = `${os.platform()}_${os.arch()}`;
    switch (platform) {
        case 'linux_x64':
        case 'darwin_x64':
        case 'darwin_arm64':
            return platform;
        default:
            throw new errors_1.NotSupportedYetError(`Unsupported plaform ${platform}`);
    }
}
exports.getPlatform = getPlatform;
function nethersolcPath(version) {
    const platform = getPlatform();
    return path.resolve(__dirname, '..', 'nethersolc', platform, version, 'solc');
}
exports.nethersolcPath = nethersolcPath;
function fullVersionFromMajor(majorVersion) {
    switch (majorVersion) {
        case '7':
            return '0.7.6';
        case '8':
            return '0.8.14';
    }
}
exports.fullVersionFromMajor = fullVersionFromMajor;
//# sourceMappingURL=nethersolc.js.map