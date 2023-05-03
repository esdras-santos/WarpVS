"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARRAY = exports.WM_WRITE_FELT = exports.WM_ALLOC = exports.WM_TO_FELT_ARRAY = exports.WM_READ_ID = exports.WM_READ_FELT = exports.WM_NEW = exports.WM_INDEX_STATIC = exports.WM_INDEX_DYN = exports.WM_DYN_ARRAY_LENGTH = exports.WARP_UINT256 = exports.WARP_KECCAK = exports.STRING_HASH = exports.PACK_BYTES_FELT = exports.NARROW_SAFE = exports.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY_SPL = exports.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY = exports.FELT_TO_UINT256 = exports.FELT_ARRAY_TO_WARP_MEMORY_ARRAY = exports.FELT_ARRAY_CONCAT = exports.BYTE_ARRAY_LENGTH = exports.BYTE_ARRAY_TO_FELT_VALUE = exports.BYTE256_AT_INDEX = exports.INT_CONVERSIONS = exports.BYTES_CONVERSIONS = exports.DYNAMIC_ARRAYS_UTIL = exports.WARPLIB_INTEGER = exports.WARPLIB_MATHS = exports.WARPLIB_KECCAK = exports.WARPLIB_MEMORY = exports.GET_CONTRACT_ADDRESS = exports.EMIT_EVENT = exports.DEPLOY = exports.UINT256_SUB = exports.UINT256_MUL = exports.UINT256_LT = exports.UINT256_LE = exports.UINT256_EQ = exports.UINT256_ADD = exports.SPLIT_FELT = exports.IS_LE_FELT = exports.IS_LE = exports.FINALIZE_KECCAK = exports.DICT_WRITE = exports.DICT_READ = exports.DICT_ACCESS = exports.DEFAULT_DICT_NEW = exports.DEFAULT_DICT_FINALIZE = exports.BITWISE_BUILTIN = exports.ALLOC = void 0;
exports.U184_TO_FELT = exports.U184_FROM_FELT = exports.U176_TO_FELT = exports.U176_FROM_FELT = exports.U168_TO_FELT = exports.U168_FROM_FELT = exports.U160_TO_FELT = exports.U160_FROM_FELT = exports.U152_TO_FELT = exports.U152_FROM_FELT = exports.U144_TO_FELT = exports.U144_FROM_FELT = exports.U136_TO_FELT = exports.U136_FROM_FELT = exports.U128_TO_FELT = exports.U128_FROM_FELT = exports.U120_TO_FELT = exports.U120_FROM_FELT = exports.U112_TO_FELT = exports.U112_FROM_FELT = exports.U104_TO_FELT = exports.U104_FROM_FELT = exports.U96_TO_FELT = exports.U96_FROM_FELT = exports.U88_TO_FELT = exports.U88_FROM_FELT = exports.U80_TO_FELT = exports.U80_FROM_FELT = exports.U72_TO_FELT = exports.U72_FROM_FELT = exports.U64_TO_FELT = exports.U64_FROM_FELT = exports.U56_TO_FELT = exports.U56_FROM_FELT = exports.U48_TO_FELT = exports.U48_FROM_FELT = exports.U40_TO_FELT = exports.U40_FROM_FELT = exports.U32_TO_FELT = exports.U32_FROM_FELT = exports.U24_TO_FELT = exports.U24_FROM_FELT = exports.U16_TO_FELT = exports.U16_FROM_FELT = exports.U8_TO_FELT = exports.U8_FROM_FELT = exports.BOOL_INTO_FELT252 = exports.FELT252_INTO_BOOL = exports.U256_FROM_FELTS = exports.ARRAY_TRAIT = void 0;
exports.MEMORY_TRAIT = exports.WARP_MEMORY = exports.INTO = exports.CONTRACT_ADDRESS = exports.GET_CALLER_ADDRESS = exports.U256_OVERFLOW_SUB = exports.U256_OVERFLOW_ADD = exports.U128_OVERFLOW_SUB = exports.U128_OVERFLOW_ADD = exports.U64_OVERFLOW_SUB = exports.U64_OVERFLOW_ADD = exports.U32_OVERFLOW_SUB = exports.U32_OVERFLOW_ADD = exports.U16_OVERFLOW_SUB = exports.U16_OVERFLOW_ADD = exports.U8_OVERFLOW_SUB = exports.U8_OVERFLOW_ADD = exports.U248_TO_FELT = exports.U248_FROM_FELT = exports.U240_TO_FELT = exports.U240_FROM_FELT = exports.U232_TO_FELT = exports.U232_FROM_FELT = exports.U224_TO_FELT = exports.U224_FROM_FELT = exports.U216_TO_FELT = exports.U216_FROM_FELT = exports.U208_TO_FELT = exports.U208_FROM_FELT = exports.U200_TO_FELT = exports.U200_FROM_FELT = exports.U192_TO_FELT = exports.U192_FROM_FELT = void 0;
const CAIRO_COMMON_PATH = ['starkware', 'cairo', 'common'];
exports.ALLOC = [[...CAIRO_COMMON_PATH, 'alloc'], 'alloc'];
exports.BITWISE_BUILTIN = [
    [...CAIRO_COMMON_PATH, 'cairo_builtins'],
    'BitwiseBuiltin',
];
exports.DEFAULT_DICT_FINALIZE = [
    [...CAIRO_COMMON_PATH, 'default_dict'],
    'default_dict_finalize',
];
exports.DEFAULT_DICT_NEW = [
    [...CAIRO_COMMON_PATH, 'default_dict'],
    'default_dict_new',
];
exports.DICT_ACCESS = [
    [...CAIRO_COMMON_PATH, 'dict_access'],
    'DictAccess',
];
exports.DICT_READ = [[...CAIRO_COMMON_PATH, 'dict'], 'dict_read'];
exports.DICT_WRITE = [[...CAIRO_COMMON_PATH, 'dict'], 'dict_write'];
exports.FINALIZE_KECCAK = [
    [...CAIRO_COMMON_PATH, 'cairo_keccak', 'keccak'],
    'finalize_keccak',
];
exports.IS_LE = [[...CAIRO_COMMON_PATH, 'math_cmp'], 'is_le'];
exports.IS_LE_FELT = [[...CAIRO_COMMON_PATH, 'math_cmp'], 'is_le_felt'];
exports.SPLIT_FELT = [[...CAIRO_COMMON_PATH, 'math'], 'split_felt'];
exports.UINT256_ADD = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_add'];
exports.UINT256_EQ = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_eq'];
exports.UINT256_LE = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_le'];
exports.UINT256_LT = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_lt'];
exports.UINT256_MUL = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_mul'];
exports.UINT256_SUB = [[...CAIRO_COMMON_PATH, 'uint256'], 'uint256_sub'];
//------------------------------------------------------
const STARKWARE_SYSCALL_PATH = ['starkware', 'starknet', 'common', 'syscalls'];
exports.DEPLOY = [[...STARKWARE_SYSCALL_PATH], 'deploy'];
exports.EMIT_EVENT = [[...STARKWARE_SYSCALL_PATH], 'emit_event'];
exports.GET_CONTRACT_ADDRESS = [
    [...STARKWARE_SYSCALL_PATH],
    'get_contract_address',
];
//------------------------------------------------------
exports.WARPLIB_MEMORY = ['warplib', 'memory'];
exports.WARPLIB_KECCAK = ['warplib', 'keccak'];
exports.WARPLIB_MATHS = ['warplib', 'maths'];
exports.WARPLIB_INTEGER = ['warplib', 'integer'];
exports.DYNAMIC_ARRAYS_UTIL = ['warplib', 'dynamic_arrays_util'];
exports.BYTES_CONVERSIONS = [...exports.WARPLIB_MATHS, 'bytes_conversions'];
exports.INT_CONVERSIONS = [...exports.WARPLIB_MATHS, 'int_conversions'];
exports.BYTE256_AT_INDEX = [
    [...exports.WARPLIB_MATHS, 'bytes_access'],
    'byte256_at_index',
];
exports.BYTE_ARRAY_TO_FELT_VALUE = [
    [...exports.DYNAMIC_ARRAYS_UTIL],
    'byte256_at_index',
];
exports.BYTE_ARRAY_LENGTH = [[...exports.DYNAMIC_ARRAYS_UTIL], 'byte256_at_index'];
exports.FELT_ARRAY_CONCAT = [[...exports.WARPLIB_KECCAK], 'felt_array_concat'];
exports.FELT_ARRAY_TO_WARP_MEMORY_ARRAY = [
    [...exports.DYNAMIC_ARRAYS_UTIL],
    'felt_array_to_warp_memory_array',
];
exports.FELT_TO_UINT256 = [[...exports.WARPLIB_MATHS, 'utils'], 'felt_to_uint256'];
exports.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY = [
    [...exports.DYNAMIC_ARRAYS_UTIL],
    'fixed_bytes256_to_felt_dynamic_array',
];
exports.FIXED_BYTES256_TO_FELT_DYNAMIC_ARRAY_SPL = [
    [...exports.DYNAMIC_ARRAYS_UTIL],
    'fixed_bytes256_to_felt_dynamic_array_spl',
];
exports.NARROW_SAFE = [[...exports.WARPLIB_MATHS, 'utils'], 'narrow_safe'];
exports.PACK_BYTES_FELT = [[...exports.WARPLIB_KECCAK], 'pack_bytes_felt'];
exports.STRING_HASH = [['warplib', 'string_hash'], 'string_hash'];
exports.WARP_KECCAK = [[...exports.WARPLIB_KECCAK], 'warp_keccak'];
exports.WARP_UINT256 = [[...exports.INT_CONVERSIONS], 'warp_uint256'];
exports.WM_DYN_ARRAY_LENGTH = [[...exports.WARPLIB_MEMORY], 'wm_dyn_array_length'];
exports.WM_INDEX_DYN = [[...exports.WARPLIB_MEMORY], 'wm_index_dyn'];
exports.WM_INDEX_STATIC = [[...exports.WARPLIB_MEMORY], 'wm_index_static'];
exports.WM_NEW = [[...exports.WARPLIB_MEMORY], 'wm_new'];
exports.WM_READ_FELT = [[...exports.WARPLIB_MEMORY], 'wm_read_felt'];
exports.WM_READ_ID = [[...exports.WARPLIB_MEMORY], 'wm_read_id'];
exports.WM_TO_FELT_ARRAY = [[...exports.WARPLIB_MEMORY], 'wm_to_felt_array'];
exports.WM_ALLOC = [[...exports.WARPLIB_MEMORY], 'wm_alloc'];
exports.WM_WRITE_FELT = [[...exports.WARPLIB_MEMORY], 'wm_write_felt'];
exports.ARRAY = [['array'], 'Array'];
exports.ARRAY_TRAIT = [['array'], 'ArrayTrait'];
exports.U256_FROM_FELTS = [[...exports.WARPLIB_INTEGER], 'u256_from_felts'];
exports.FELT252_INTO_BOOL = [[...exports.WARPLIB_INTEGER], 'felt252_into_bool'];
exports.BOOL_INTO_FELT252 = [[...exports.WARPLIB_INTEGER], 'bool_into_felt252'];
/**  cairo1 uX <-> felt conversions */
// u8 <-> felt
exports.U8_FROM_FELT = [['integer'], 'u8_from_felt252'];
exports.U8_TO_FELT = [['integer'], 'u8_to_felt252'];
// u16 <-> felt
exports.U16_FROM_FELT = [['integer'], 'u16_from_felt252'];
exports.U16_TO_FELT = [['integer'], 'u16_to_felt252'];
// u24 <-> felt
exports.U24_FROM_FELT = [['integer'], 'u24_from_felt252'];
exports.U24_TO_FELT = [['integer'], 'u24_to_felt252'];
// u32 <-> felt
exports.U32_FROM_FELT = [['integer'], 'u32_from_felt252'];
exports.U32_TO_FELT = [['integer'], 'u32_to_felt252'];
// u40 <-> felt
exports.U40_FROM_FELT = [['integer'], 'u40_from_felt252'];
exports.U40_TO_FELT = [['integer'], 'u40_to_felt252'];
// u48 <-> felt
exports.U48_FROM_FELT = [['integer'], 'u48_from_felt252'];
exports.U48_TO_FELT = [['integer'], 'u48_to_felt252'];
// u56 <-> felt
exports.U56_FROM_FELT = [['integer'], 'u56_from_felt252'];
exports.U56_TO_FELT = [['integer'], 'u56_to_felt252'];
// u64 <-> felt
exports.U64_FROM_FELT = [['integer'], 'u64_from_felt252'];
exports.U64_TO_FELT = [['integer'], 'u64_to_felt252'];
// u72 <-> felt
exports.U72_FROM_FELT = [['integer'], 'u72_from_felt252'];
exports.U72_TO_FELT = [['integer'], 'u72_to_felt252'];
// u80 <-> felt
exports.U80_FROM_FELT = [['integer'], 'u80_from_felt252'];
exports.U80_TO_FELT = [['integer'], 'u80_to_felt252'];
// u88 <-> felt
exports.U88_FROM_FELT = [['integer'], 'u88_from_felt252'];
exports.U88_TO_FELT = [['integer'], 'u88_to_felt252'];
// u96 <-> felt
exports.U96_FROM_FELT = [['integer'], 'u96_from_felt252'];
exports.U96_TO_FELT = [['integer'], 'u96_to_felt252'];
// u104 <-> felt
exports.U104_FROM_FELT = [['integer'], 'u104_from_felt252'];
exports.U104_TO_FELT = [['integer'], 'u104_to_felt252'];
// u112 <-> felt
exports.U112_FROM_FELT = [['integer'], 'u112_from_felt252'];
exports.U112_TO_FELT = [['integer'], 'u112_to_felt252'];
// u120 <-> felt
exports.U120_FROM_FELT = [['integer'], 'u120_from_felt252'];
exports.U120_TO_FELT = [['integer'], 'u120_to_felt252'];
// u128 <-> felt
exports.U128_FROM_FELT = [['integer'], 'u128_from_felt252'];
exports.U128_TO_FELT = [['integer'], 'u128_to_felt252'];
// u136 <-> felt
exports.U136_FROM_FELT = [['integer'], 'u136_from_felt252'];
exports.U136_TO_FELT = [['integer'], 'u136_to_felt252'];
// u144 <-> felt
exports.U144_FROM_FELT = [['integer'], 'u144_from_felt252'];
exports.U144_TO_FELT = [['integer'], 'u144_to_felt252'];
// u152 <-> felt
exports.U152_FROM_FELT = [['integer'], 'u152_from_felt252'];
exports.U152_TO_FELT = [['integer'], 'u152_to_felt252'];
// u160 <-> felt
exports.U160_FROM_FELT = [['integer'], 'u160_from_felt252'];
exports.U160_TO_FELT = [['integer'], 'u160_to_felt252'];
// u168 <-> felt
exports.U168_FROM_FELT = [['integer'], 'u168_from_felt252'];
exports.U168_TO_FELT = [['integer'], 'u168_to_felt252'];
// u176 <-> felt
exports.U176_FROM_FELT = [['integer'], 'u176_from_felt252'];
exports.U176_TO_FELT = [['integer'], 'u176_to_felt252'];
// u184 <-> felt
exports.U184_FROM_FELT = [['integer'], 'u184_from_felt252'];
exports.U184_TO_FELT = [['integer'], 'u184_to_felt252'];
// u192 <-> felt
exports.U192_FROM_FELT = [['integer'], 'u192_from_felt252'];
exports.U192_TO_FELT = [['integer'], 'u192_to_felt252'];
// u200 <-> felt
exports.U200_FROM_FELT = [['integer'], 'u200_from_felt252'];
exports.U200_TO_FELT = [['integer'], 'u200_to_felt252'];
// u208 <-> felt
exports.U208_FROM_FELT = [['integer'], 'u208_from_felt252'];
exports.U208_TO_FELT = [['integer'], 'u208_to_felt252'];
// u216 <-> felt
exports.U216_FROM_FELT = [['integer'], 'u216_from_felt252'];
exports.U216_TO_FELT = [['integer'], 'u216_to_felt252'];
// u224 <-> felt
exports.U224_FROM_FELT = [['integer'], 'u224_from_felt252'];
exports.U224_TO_FELT = [['integer'], 'u224_to_felt252'];
// u232 <-> felt
exports.U232_FROM_FELT = [['integer'], 'u232_from_felt252'];
exports.U232_TO_FELT = [['integer'], 'u232_to_felt252'];
// u240 <-> felt
exports.U240_FROM_FELT = [['integer'], 'u240_from_felt252'];
exports.U240_TO_FELT = [['integer'], 'u240_to_felt252'];
// u248 <-> felt
exports.U248_FROM_FELT = [['integer'], 'u248_from_felt252'];
exports.U248_TO_FELT = [['integer'], 'u248_to_felt252'];
/**  ------------------------------ */
/**  cairo1 unsafe operations */
exports.U8_OVERFLOW_ADD = [['integer'], 'u8_overflowing_add'];
exports.U8_OVERFLOW_SUB = [['integer'], 'u8_overflowing_sub'];
exports.U16_OVERFLOW_ADD = [['integer'], 'u16_overflowing_add'];
exports.U16_OVERFLOW_SUB = [['integer'], 'u16_overflowing_sub'];
exports.U32_OVERFLOW_ADD = [['integer'], 'u32_overflowing_add'];
exports.U32_OVERFLOW_SUB = [['integer'], 'u32_overflowing_sub'];
exports.U64_OVERFLOW_ADD = [['integer'], 'u64_overflowing_add'];
exports.U64_OVERFLOW_SUB = [['integer'], 'u64_overflowing_sub'];
exports.U128_OVERFLOW_ADD = [['integer'], 'u128_overflowing_add'];
exports.U128_OVERFLOW_SUB = [['integer'], 'u128_overflowing_sub'];
exports.U256_OVERFLOW_ADD = [['integer'], 'u256_overflowing_add'];
exports.U256_OVERFLOW_SUB = [['integer'], 'u256_overflow_sub'];
exports.GET_CALLER_ADDRESS = [['starknet'], 'get_caller_address'];
exports.CONTRACT_ADDRESS = [['starknet'], 'ContractAddress'];
exports.INTO = [['traits'], 'Into'];
exports.WARP_MEMORY = [['warplib', 'warp_memory'], 'WarpMemory'];
exports.MEMORY_TRAIT = [['warplib', 'warp_memory'], 'MemoryTrait'];
//# sourceMappingURL=importPaths.js.map