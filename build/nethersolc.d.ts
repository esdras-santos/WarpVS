declare type SupportedPlatforms = 'linux_x64' | 'darwin_x64' | 'darwin_arm64';
export declare type SupportedSolcVersions = '7' | '8';
export declare function getPlatform(): SupportedPlatforms;
export declare function nethersolcPath(version: SupportedSolcVersions): string;
export declare function fullVersionFromMajor(majorVersion: SupportedSolcVersions): string;
export {};
//# sourceMappingURL=nethersolc.d.ts.map