"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InheritanceInliner = void 0;
const cairoNodes_1 = require("../../ast/cairoNodes");
const mapper_1 = require("../../ast/mapper");
const errors_1 = require("../../utils/errors");
const constructorInheritance_1 = require("./constructorInheritance");
const eventInheritance_1 = require("./eventInheritance");
const functionInheritance_1 = require("./functionInheritance");
const libraryInheritance_1 = require("./libraryInheritance");
const modifiersInheritance_1 = require("./modifiersInheritance");
const storageVariablesInheritance_1 = require("./storageVariablesInheritance");
const utils_1 = require("./utils");
class InheritanceInliner extends mapper_1.ASTMapper {
    constructor() {
        super(...arguments);
        this.counter = 0;
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // ReferencedLibraries pass adds referenced libraries to the list of
            // linearized base contracts of each contract.
            'Rl',
            // StorageAllocator takes care of variable initialization, which
            // are needed when solving constructors
            'Sa',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitCairoContract(node, ast) {
        // Referenced libraries pass added the referenced libraries to the
        // linearized list of base contracts of a certain contract `A`.
        // All contracts that inherit from `A` need to add those libraries as well.
        (0, libraryInheritance_1.solveLibraryInheritance)(node, ast);
        // This functions handles:
        //   - the assignment of a constructor to each contract
        //   - calling the functions for variable initialization
        //   - inheritance in constructors
        (0, constructorInheritance_1.solveConstructors)(node, ast, this.generateIndex.bind(this));
        if (node.vLinearizedBaseContracts.length < 2) {
            // LinearizedBaseContracts includes self as the first element,
            // and we only care about those which inherit from something else
            return;
        }
        // The remapping structures are used to update the references to the new members
        // added in the current contract. The idea is to clone each member from the base
        // contracts and add it to the current contract, so the pair
        // (<old_member_id>, <cloned_member>) is stored in the map for each one of them.
        //
        // When there is an overriding function (or modifier) all references to the function
        // should point to this particular function and not the overridden implementation of it.
        // That is what the overriders maps are used for, they keep the reference to the
        // overriding member.
        // Nevertheless, the references to all the cloned members must also be kept, since they
        // can be called specifying the contract, even if they are being overridden somewhere
        // else down the line of inheritance.
        //
        // Example:
        //    abstract contract A {
        //      function f() public view virtual returns (uint256);
        //      function g() public view virtual returns (uint256) {
        //        return 10;
        //      }
        //    }
        //    abstract contract B is A {
        //      function g() public view override returns (uint256) {
        //        return f();
        //      }
        //    }
        // When analizing contract B, cloned functions f and g will be added, so the
        // function remappings will look something like:
        //    functionRemapping = {
        //      (A.f.id, cloned_f),
        //      (A.g.id, cloned_g)
        //    }
        //    functionRemappingOverriders = {
        //      (A.f.id, cloned_f),
        //      (A.g.id, B.g),
        //      (B.g, B.g)
        //    }
        const functionRemapping = new Map();
        const functionRemappingOverriders = new Map();
        const variableRemapping = new Map();
        const modifierRemapping = new Map();
        const modifierRemappingOverriders = new Map();
        const eventRemapping = new Map();
        (0, functionInheritance_1.addPrivateSuperFunctions)(node, functionRemapping, functionRemappingOverriders, ast);
        (0, storageVariablesInheritance_1.addStorageVariables)(node, variableRemapping, ast);
        (0, modifiersInheritance_1.addNonOverriddenModifiers)(node, modifierRemapping, modifierRemappingOverriders, ast);
        (0, eventInheritance_1.addEventDefinition)(node, eventRemapping, ast);
        (0, utils_1.updateReferencedDeclarations)(node, functionRemapping, functionRemappingOverriders, ast);
        (0, utils_1.updateReferencedDeclarations)(node, variableRemapping, variableRemapping, ast);
        (0, utils_1.updateReferencedDeclarations)(node, modifierRemapping, modifierRemappingOverriders, ast);
        (0, utils_1.updateReferenceEmitStatements)(node, eventRemapping, ast);
        (0, utils_1.removeBaseContractDependence)(node);
        ast.setContextRecursive(node);
        this.commonVisit(node, ast);
    }
    static map(ast) {
        // The inheritance inliner needs to process subclasses before their parents
        // If a base contract is processed before a derived one then the methods added
        // to the base will get copied into the derived leading to unnecessary duplication
        const contractsToProcess_ = ast.roots.flatMap((root) => root.vContracts);
        let contractsToProcess = contractsToProcess_.map((cd) => {
            if (!(cd instanceof cairoNodes_1.CairoContract)) {
                throw new errors_1.TranspileFailedError(`Expected all contracts to be cairo contracts prior to inlining`);
            }
            return cd;
        });
        while (contractsToProcess.length > 0) {
            // Find contracts that no other contract inherits from
            const mostDerivedContracts = contractsToProcess.filter((derivedContract) => !contractsToProcess.some((otherContract) => (0, utils_1.getBaseContracts)(otherContract).includes(derivedContract)));
            if (mostDerivedContracts.length === 0 && contractsToProcess.length > 0) {
                throw new errors_1.TranspileFailedError('Unable to serialise contracts');
            }
            contractsToProcess = contractsToProcess.filter((c) => !mostDerivedContracts.includes(c));
            mostDerivedContracts.forEach((contract) => {
                const pass = new this();
                pass.dispatchVisit(contract, ast);
            });
        }
        return ast;
    }
    generateIndex() {
        return this.counter++;
    }
}
exports.InheritanceInliner = InheritanceInliner;
//# sourceMappingURL=inheritanceInliner.js.map