"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTranspilationError = exports.transform = exports.transpile = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const cairoWriter_1 = require("./cairoWriter");
const passes_1 = require("./passes");
const solWriter_1 = require("./solWriter");
const astPrinter_1 = require("./utils/astPrinter");
const cli_1 = require("./utils/cli");
const errors_1 = require("./utils/errors");
const formatting_1 = require("./utils/formatting");
const utils_1 = require("./utils/utils");
function transpile(ast, options) {
    const cairoAST = applyPasses(ast, options);
    const writer = new solc_typed_ast_1.ASTWriter((0, cairoWriter_1.CairoASTMapping)(cairoAST, options.strict ?? false), new solc_typed_ast_1.PrettyFormatter(4, 0), ast.inference.version);
    return cairoAST.roots.map((sourceUnit) => [sourceUnit.absolutePath, writer.write(sourceUnit)]);
}
exports.transpile = transpile;
function transform(ast, options) {
    const cairoAST = applyPasses(ast, options);
    const writer = new solc_typed_ast_1.ASTWriter((0, solWriter_1.CairoToSolASTWriterMapping)(!!options.stubs), new solc_typed_ast_1.PrettyFormatter(4, 0), ast.inference.version);
    return cairoAST.roots.map((sourceUnit) => [
        sourceUnit.absolutePath,
        (0, formatting_1.removeExcessNewlines)(writer.write(sourceUnit), 2),
    ]);
}
exports.transform = transform;
function applyPasses(ast, options) {
    const passes = (0, cli_1.createPassMap)([
        ['Tf', passes_1.TupleFixes],
        ['Tnr', passes_1.TypeNameRemover],
        ['Ru', passes_1.RejectUnsupportedFeatures],
        ['Iat', passes_1.InlineAssemblyTransformer],
        ['Wa', passes_1.WarnSupportedFeatures],
        ['Ss', passes_1.SourceUnitSplitter],
        ['Ct', passes_1.TypeStringsChecker],
        ['Idi', passes_1.ImportDirectiveIdentifier],
        ['L', passes_1.LiteralExpressionEvaluator],
        ['Na', passes_1.NamedArgsRemover],
        ['Ufr', passes_1.UsingForResolver],
        ['Fd', passes_1.FunctionTypeStringMatcher],
        ['Gp', passes_1.PublicStateVarsGetterGenerator],
        ['Tic', passes_1.TypeInformationCalculator],
        ['Ch', passes_1.ConstantHandler],
        ['M', passes_1.IdentifierMangler],
        ['Sai', passes_1.StaticArrayIndexer],
        ['Udt', passes_1.UserDefinedTypesConverter],
        ['Req', passes_1.Require],
        ['Ffi', passes_1.FreeFunctionInliner],
        ['Rl', passes_1.ReferencedLibraries],
        ['Sa', passes_1.StorageAllocator],
        ['Ii', passes_1.InheritanceInliner],
        ['Ech', passes_1.ExternalContractHandler],
        ['Mh', passes_1.ModifierHandler],
        ['Pfs', passes_1.PublicFunctionSplitter],
        ['Eam', passes_1.ExternalArgModifier],
        ['Lf', passes_1.LoopFunctionaliser],
        ['R', passes_1.ReturnInserter],
        ['Rv', passes_1.ReturnVariableInitializer],
        ['Ifr', passes_1.IdentityFunctionRemover],
        ['U', passes_1.UnloadingAssignment],
        ['Cos', passes_1.ConditionalSplitter],
        ['V', passes_1.VariableDeclarationInitialiser],
        ['Vs', passes_1.VariableDeclarationExpressionSplitter],
        ['Ntd', passes_1.NewToDeploy],
        ['I', passes_1.ImplicitConversionToExplicit],
        ['Abi', passes_1.ABIBuiltins],
        ['Ev', passes_1.Events],
        ['Dh', passes_1.DeleteHandler],
        ['Rf', passes_1.References],
        ['Abc', passes_1.ArgBoundChecker],
        ['Ec', passes_1.EnumConverter],
        ['B', passes_1.BuiltinHandler],
        ['Bc', passes_1.BytesConverter],
        ['Us', passes_1.UnreachableStatementPruner],
        ['Fp', passes_1.FunctionPruner],
        ['E', passes_1.ExpressionSplitter],
        ['An', passes_1.AnnotateImplicits],
        ['Lv', passes_1.IfStatementTempVarPostpender],
        ['Ci', passes_1.CairoUtilImporter],
        ['Dus', passes_1.DropUnusedSourceUnits],
        ['Cs', passes_1.CairoStubProcessor],
    ]);
    const passesInOrder = (0, cli_1.parsePassOrder)(options.order, options.until, options.warnings, options.dev, passes);
    astPrinter_1.DefaultASTPrinter.applyOptions(options);
    printPassName('Input', options);
    printAST(ast, options);
    // Fix absolutePath in source unit
    ast = passes_1.SourceUnitPathFixer.map_(ast, options.includePaths ?? []);
    // Reject code that contains identifiers starting with certain patterns
    passes_1.RejectPrefix.map(ast);
    const finalAst = passesInOrder.reduce((ast, mapper) => {
        printPassName(mapper.getPassName(), options);
        const newAst = mapper.map(ast);
        checkAST(ast, options, mapper.getPassName());
        printAST(ast, options);
        return newAst;
    }, ast);
    const finalOpts = {
        checkTrees: options.checkTrees,
        dev: true,
        order: options.order,
        printTrees: options.printTrees,
        strict: options.strict,
        warnings: options.warnings,
        until: options.until,
    };
    checkAST(finalAst, finalOpts, 'Final AST (after all passes)');
    return finalAst;
}
function handleTranspilationError(e) {
    if (e instanceof solc_typed_ast_1.CompileFailedError) {
        (0, utils_1.printCompileErrors)(e);
        console.error('Cannot start transpilation');
    }
    else if (e instanceof errors_1.TranspilationAbandonedError) {
        console.error(`Transpilation abandoned ${e.message}`);
    }
    else {
        console.error('Unexpected error during transpilation');
        console.error(e);
        console.error('Transpilation failed');
    }
}
exports.handleTranspilationError = handleTranspilationError;
// Transpilation printing
function printPassName(name, options) {
    if (options.printTrees)
        console.log(`---${name}---`);
}
function printAST(ast, options) {
    if (options.printTrees) {
        ast.roots.map((root) => {
            console.log(astPrinter_1.DefaultASTPrinter.print(root));
            console.log();
        });
    }
}
function checkAST(ast, options, mostRecentPassName) {
    if (options.checkTrees || options.strict) {
        try {
            const success = (0, utils_1.runSanityCheck)(ast, options, mostRecentPassName);
            if (!success && options.strict) {
                throw new errors_1.TranspileFailedError(`AST failed internal consistency check. Most recently run pass: ${mostRecentPassName}`);
            }
        }
        catch (e) {
            console.error((0, formatting_1.error)(`AST failed internal consistency check. Most recently run pass: ${mostRecentPassName}`));
            throw e;
        }
    }
}
//# sourceMappingURL=transpiler.js.map