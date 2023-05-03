"use strict";
/*
  Stores all prefix/infix/suffix of solidity variables generated/modified by
  the transpiler.
  Every new generation should be added accordingly.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMIT_PREFIX = exports.TEMP_INTERFACE_SUFFIX = exports.INIT_FUNCTION_PREFIX = exports.COMPOUND_ASSIGNMENT_SUBEXPRESSION_PREFIX = exports.TUPLE_VALUE_PREFIX = exports.CONDITIONAL_RETURN_VARIABLE = exports.CONDITIONAL_FUNCTION_PREFIX = exports.PRE_SPLIT_EXPRESSION_PREFIX = exports.SPLIT_EXPRESSION_PREFIX = exports.SPLIT_VARIABLE_PREFIX = exports.WHILE_PREFIX = exports.RETURN_VALUE_PREFIX = exports.RETURN_FLAG_PREFIX = exports.INTERNAL_FUNCTION_SUFFIX = exports.IF_FUNCTIONALISER_INFIX = exports.CALLDATA_TO_MEMORY_FUNCTION_PARAMETER_PREFIX = exports.ORIGINAL_FUNCTION_PREFIX = exports.MODIFIER_PREFIX = exports.MANGLED_RETURN_PARAMETER = exports.MANGLED_PARAMETER = exports.CONSTANT_STRING_TO_MEMORY_PREFIX = exports.CALLDATA_TO_MEMORY_PREFIX = exports.MANGLED_WARP = exports.FREE_FILE_NAME = exports.TUPLE_FILLER_PREFIX = void 0;
// Used in TupleFiller in TupleFixes
exports.TUPLE_FILLER_PREFIX = '__warp_tf';
// Used in SourceUnitSplitter
exports.FREE_FILE_NAME = '__warp_free.cairo';
// Used in IdentifierManglerPass and CairoStubProcessor
exports.MANGLED_WARP = '__warp_';
// Used in StaticArrayIndexer
exports.CALLDATA_TO_MEMORY_PREFIX = 'cd_to_wm_';
// Used in StorageAllocator
exports.CONSTANT_STRING_TO_MEMORY_PREFIX = 'memory_string';
// Used in ModifierHandler in FunctionModifierHandler
exports.MANGLED_PARAMETER = '__warp_parameter_';
exports.MANGLED_RETURN_PARAMETER = '__warp_ret_parameter_';
exports.MODIFIER_PREFIX = '__warp_modifier_';
exports.ORIGINAL_FUNCTION_PREFIX = '__warp_original_';
// Used in ExternalArgModifier in MemoryRefInputModifier
exports.CALLDATA_TO_MEMORY_FUNCTION_PARAMETER_PREFIX = 'cd_to_wm_param_';
// Used in IfFunctionaliser
exports.IF_FUNCTIONALISER_INFIX = '_if_part';
// Used in PublicFunctionSplitter in ExternalFunctionCreator
exports.INTERNAL_FUNCTION_SUFFIX = '_internal';
// Used in LoopFunctionaliser
//  - Used in ReturnToBreak
exports.RETURN_FLAG_PREFIX = '__warp_rf';
exports.RETURN_VALUE_PREFIX = '__warp_rv';
//  - Used in utils
exports.WHILE_PREFIX = '__warp_while';
// Used in  VariableDeclarationExpressionSplitter
exports.SPLIT_VARIABLE_PREFIX = '__warp_td_';
// Used in Expression Splitter
exports.SPLIT_EXPRESSION_PREFIX = '__warp_se_';
// Used in Conditional Splitter
exports.PRE_SPLIT_EXPRESSION_PREFIX = '__warp_pse_';
exports.CONDITIONAL_FUNCTION_PREFIX = '__warp_conditional_';
exports.CONDITIONAL_RETURN_VARIABLE = '__warp_rc_';
exports.TUPLE_VALUE_PREFIX = '__warp_tv_';
// Used in UnloadingAssignment
exports.COMPOUND_ASSIGNMENT_SUBEXPRESSION_PREFIX = '__warp_cs_';
// Used in StorageAllocator and InheritanceInliner in ConstructorInheritance
exports.INIT_FUNCTION_PREFIX = '__warp_init_';
// Used in ExternalContractHandler
// Used in SourceUnitWriter (to distinguish generated interfaces from user defined ones)
exports.TEMP_INTERFACE_SUFFIX = '@interface';
// Used in cairoUtilGenFunc/event.ts
exports.EMIT_PREFIX = '__warp_emit_';
//# sourceMappingURL=nameModifiers.js.map