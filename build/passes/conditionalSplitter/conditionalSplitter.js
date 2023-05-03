"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalSplitter = void 0;
const solc_typed_ast_1 = require("solc-typed-ast");
const astPrinter_1 = require("../../utils/astPrinter");
const cloning_1 = require("../../utils/cloning");
const errors_1 = require("../../utils/errors");
const functionGeneration_1 = require("../../utils/functionGeneration");
const nameModifiers_1 = require("../../utils/nameModifiers");
const nodeTemplates_1 = require("../../utils/nodeTemplates");
const utils_1 = require("../../utils/utils");
const expressionSplitter_1 = require("../expressionSplitter");
const conditionalFunctionaliser_1 = require("./utils/conditionalFunctionaliser");
const splitter_1 = require("./utils/splitter");
function* expressionGenerator(prefix) {
    const count = (0, utils_1.counterGenerator)();
    while (true) {
        yield `${prefix}${count.next().value}`;
    }
}
/** This pass handles several features:
      - Conditionals
      - Expression Splitting
      - Tuple Assignment Splitting

    1. CONDITIONALS:
    Every conditional is handled such that a new function is generated. The
    idea would be to have the following conditional:
        
        condition ? thenBranch : elseBranch

    and generate a function with the following structure:

      function __warp_conditional():
        if (condition)
          return thenBranch
        else return elseBranch

    In addition this function needs to capture all local variables used inside
    the conditional and pass them as parameters. Those variables need to be
    returned as well since its value might have been changed inside the conditional.

    A variable `conditionalResult` is also created to capture the result of the
    conditional itself. When `__warp_conditional()` is called, its return value needs
    to be assigned to `conditionalResult` and all the local variables that were
    captured by the function; in order to do so the necessary statements are added
    before the statement where the conditional was.

    Finally, the conditional is replaced with `conditionalResult`. Notice that
    conditionals might return more than one value or no value at all. This cases
    are handled as well.

    2. EXPRESSION SPLITTING:
    If the splitting of expressions is performed before handling conditionals, both
    branches of a conditional might get extracted and evaluated before actually having
    to execute the conditional, which breaks the idea of conditionals only evaluating
    one of its branches. An example of this is the following case:

      condition ? f() : g()

    which is transformed into:

      __warp_var_1 = f();
      __warp_var_2 = g();
      condition ? __warp_var_1 : __warp_var_2

    If the splitting of expressions is performed after handling conditionals, there
    might be the case where one of the local variables (that is used inside the conditional)
    changes its value in the same statement where the conditional is, which means that
    change will not be reflected when extracting the conditional to a function. A simple
    example:
      
      f(y = 5, true ? y : 0)
    
    Handling the conditional first will result in:

      (conditionalResult, y) = __warp_conditional(y)
      f(y = 5, conditionalResult)

    which is not correct since `y` needs to be assigned first
    
    As the splitting of expressions can not happen before nor after handling conditionals,
    they have to be handled together. In order to do so, this pass inherits from
    ExpressionSplitter pass. The `visitAssignment` method is the same for both passes. However,
    `visitFunctionCall` has a different strategy to compute the data location of the variable
    that will store the call, so its definition is overwritten.

    3. TUPLE ASSIGNMENT SPLITTING:
    Converts a non-declaration tuple assignment into a declaration of temporary variables,
    and piecewise assignments (x,y) = (y,x) -> (int a, int b) = (y,x); x = a; y = b;

    Also converts tuple returns into a tuple declaration and elementwise return
    This allows type conversions in cases where the individual elements would otherwise not be
    accessible, such as when returning a function call

    This is handled before the expression splitting in order to handle assignments correctly.
    After handling conditionals, the statement where the function call is assigned to all
    the corresponding variables needs to be handled by this pass as well. That's why the
    splitting of tuple assignments is done in this pass as well.
 */
class ConditionalSplitter extends expressionSplitter_1.ExpressionSplitter {
    constructor() {
        super(...arguments);
        this.eGen = expressionGenerator(nameModifiers_1.PRE_SPLIT_EXPRESSION_PREFIX);
        this.eGenTuple = expressionGenerator(nameModifiers_1.TUPLE_VALUE_PREFIX);
        this.nameCounter = (0, utils_1.counterGenerator)();
    }
    // Function to add passes that should have been run before this pass
    addInitialPassPrerequisites() {
        const passKeys = new Set([
            // Assignments operator is assumed to be '=', so the other possible
            // operators like '+=' or '*=' need to be handled first, which is done
            // in UnloadingAssignment pass
            'U',
        ]);
        passKeys.forEach((key) => this.addPassPrerequisite(key));
    }
    visitExpressionStatement(node, ast) {
        let visitNode = node;
        if (node.vExpression instanceof solc_typed_ast_1.Assignment &&
            node.vExpression.vLeftHandSide instanceof solc_typed_ast_1.TupleExpression) {
            visitNode = (0, splitter_1.splitTupleAssignment)(node.vExpression, this.eGenTuple, ast);
            ast.replaceNode(node, visitNode);
        }
        this.commonVisit(visitNode, ast);
    }
    visitFunctionCall(node, ast) {
        this.commonVisit(node, ast);
        if (!(node.vReferencedDeclaration instanceof solc_typed_ast_1.FunctionDefinition) ||
            node.parent instanceof solc_typed_ast_1.ExpressionStatement ||
            node.parent instanceof solc_typed_ast_1.VariableDeclarationStatement) {
            return;
        }
        const returnTypes = node.vReferencedDeclaration.vReturnParameters.vParameters;
        if (returnTypes.length === 0) {
            (0, splitter_1.splitFunctionCallWithoutReturn)(node, ast);
        }
        else if (returnTypes.length === 1) {
            (0, splitter_1.splitFunctionCallWithReturn)(node, returnTypes[0], this.eGen, ast);
        }
        else {
            throw new errors_1.TranspileFailedError(`ConditionalSplitter expects functions to have at most 1 return argument. ${(0, astPrinter_1.printNode)(node)} ${node.vFunctionName} has ${returnTypes.length}`);
        }
    }
    visitConditional(node, ast) {
        const containingFunction = (0, utils_1.getContainingFunction)(node);
        const variables = (0, conditionalFunctionaliser_1.getNodeVariables)(node);
        const args = (0, conditionalFunctionaliser_1.getInputs)(variables, ast);
        const inputParams = (0, conditionalFunctionaliser_1.getParams)(variables, ast);
        const newFuncId = ast.reserveId();
        const conditionalResult = (0, conditionalFunctionaliser_1.getConditionalReturn)(node, newFuncId, this.nameCounter, ast);
        const returnParams = (0, conditionalFunctionaliser_1.getReturns)(variables, conditionalResult, ast);
        const func = new solc_typed_ast_1.FunctionDefinition(newFuncId, '', containingFunction.scope, containingFunction.kind === solc_typed_ast_1.FunctionKind.Free ? solc_typed_ast_1.FunctionKind.Free : solc_typed_ast_1.FunctionKind.Function, `${nameModifiers_1.CONDITIONAL_FUNCTION_PREFIX}${containingFunction.name}_${this.nameCounter.next().value}`, false, // virtual
        solc_typed_ast_1.FunctionVisibility.Internal, containingFunction.stateMutability, false, // isConstructor
        inputParams, returnParams, [], undefined, (0, conditionalFunctionaliser_1.createFunctionBody)(node, conditionalResult, returnParams, ast));
        (0, functionGeneration_1.fixParameterScopes)(func);
        containingFunction.vScope.insertBefore(func, containingFunction);
        ast.registerChild(func, containingFunction.vScope);
        this.dispatchVisit(func, ast);
        // Conditionals might return a value, or they might be void, in which
        // case conditionalResult would contain no elements. Both cases need to be handled
        // separately
        if (conditionalResult.length !== 0) {
            // conditionalResult was already used as the return value of the
            // conditional in the new function. It needs to be cloned to capture the
            // return value of the new function in containingFunction
            const result = conditionalResult.map((v) => {
                const variable = (0, cloning_1.cloneASTNode)(v, ast);
                variable.scope = containingFunction.id;
                return variable;
            });
            const statements = (0, conditionalFunctionaliser_1.addStatementsToCallFunction)(node, result, [...variables.keys()], (0, functionGeneration_1.createCallToFunction)(func, args, ast), ast);
            statements.forEach((stmt) => {
                ast.insertStatementBefore(node, stmt);
                this.dispatchVisit(stmt, ast);
            });
            ast.replaceNode(node, (0, utils_1.toSingleExpression)(result.map((v) => (0, nodeTemplates_1.createIdentifier)(v, ast)), ast));
        }
        else {
            (0, conditionalFunctionaliser_1.getStatementsForVoidConditionals)(node, [...variables.keys()], (0, functionGeneration_1.createCallToFunction)(func, args, ast), ast);
        }
    }
    visitReturn(node, ast) {
        let nodeToVisit = node;
        if (node.vFunctionReturnParameters.vParameters.length > 1) {
            nodeToVisit = (0, splitter_1.splitReturnTuple)(node, ast);
        }
        this.commonVisit(nodeToVisit, ast);
    }
}
exports.ConditionalSplitter = ConditionalSplitter;
//# sourceMappingURL=conditionalSplitter.js.map