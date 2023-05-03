export declare const HASH_SIZE = 8;
export declare const HASH_OPTION = "sha256";
/**
  Is used post transpilation to insert the class hash for any contract that can deploy another.
  During transpilation 0 is placed where the class hash would be because contracts to declare
  have not yet been fully transpiled. At this stage all contracts have been transpiled, so they
  can be  compiled and their class hash computed. Each class hash needed is written into the
  cairo contract
  @param contractPath: The path to the cairo File being processed.
  @param outputDir: Directory where the path is getting stored
  @param contractHashToClassHash:
    A mapping that holds the contract path with out the pathPrefix and maps
    it to the contracts class hash.
  @returns cairoFilePath: The path to the cairo File that was processed.
 */
export declare function postProcessCairoFile(contractPath: string, outputDir: string, debugInfo: boolean, contractHashToClassHash: Map<string, string>): string;
/**
 *  Read a cairo file and for each constant of the form `const name = value`
 *  if `name` is of the form   `<contractName>_<contractId>` then it corresponds
 *  to a placeholder waiting to be filled with the corresponding contract class hash
 *  @param contractPath location of cairo file
 *  @param declarationAddresses mapping of: (placeholder hash) => (starknet class hash)
 */
export declare function setDeclaredAddresses(contractPath: string, declarationAddresses: Map<string, string>): void;
/**
 * Produce a dependency graph among Cairo files. Due to cairo rules this graph is
 * more specifically a Directed Acyclic Graph (DAG)
 * A file A is said to be dependant from a file B if file A needs the class hash
 * of file B.
 * @param root file to explore for dependencies
 * @param outputDir directory where cairo files are stored
 * @returns a map from string to list of strings, where the key is a file and the value are all the dependencies
 */
export declare function getDependencyGraph(root: string, outputDir: string): Map<string, string[]>;
/**
 * Hash function used during transpilation and post-linking so same hash
 * given same input is produced during both phases
 * @param filename filesystem path
 * @returns hashed value
 */
export declare function hashFilename(filename: string): string;
//# sourceMappingURL=postCairoWrite.d.ts.map