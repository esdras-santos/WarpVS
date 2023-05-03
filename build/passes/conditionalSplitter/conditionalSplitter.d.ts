import { Conditional, ExpressionStatement, FunctionCall, Return } from 'solc-typed-ast';
import { AST } from '../../ast/ast';
import { ExpressionSplitter } from '../expressionSplitter';
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
export declare class ConditionalSplitter extends ExpressionSplitter {
    eGen: Generator<string, string, unknown>;
    eGenTuple: Generator<string, string, unknown>;
    nameCounter: Generator<number, number, unknown>;
    addInitialPassPrerequisites(): void;
    visitExpressionStatement(node: ExpressionStatement, ast: AST): void;
    visitFunctionCall(node: FunctionCall, ast: AST): void;
    visitConditional(node: Conditional, ast: AST): void;
    visitReturn(node: Return, ast: AST): void;
}
//# sourceMappingURL=conditionalSplitter.d.ts.map