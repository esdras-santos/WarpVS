import { generateFile, PATH_TO_WARPLIB, WarplibFunctionInfo } from './utils';
import { int_conversions } from './implementations/conversions/int';
import { div_signed, div_signed_unsafe } from './implementations/maths/div';
import { exp, exp_signed, exp_signed_unsafe, exp_unsafe } from './implementations/maths/exp';
import { negate } from './implementations/maths/negate';
import { shl } from './implementations/maths/shl';
import { shr, shr_signed } from './implementations/maths/shr';
import { bitwise_not } from './implementations/maths/bitwiseNot';
import path from 'path';
import * as fs from 'fs';
import endent from 'endent';
import { glob } from 'glob';
import { parseMultipleRawCairoFunctions } from '../utils/cairoParsing';

const warplibFunctions: WarplibFunctionInfo[] = [
  div_signed(),
  div_signed_unsafe(),
  exp(),
  exp_signed(),
  exp_unsafe(),
  exp_signed_unsafe(),
  negate(),
  shl(),
  shr(),
  shr_signed(),
  // bitwise_and - handwritten
  // bitwise_or - handwritten
  bitwise_not(),
  // ---conversions---
  int_conversions(),
];
warplibFunctions.forEach((warpFunc: WarplibFunctionInfo) => generateFile(warpFunc));

const mathsContent: string = glob
  .sync(path.join(PATH_TO_WARPLIB, 'maths', '*.cairo'))
  .map((pathToFile) => {
    const fileName = path.basename(pathToFile, '.cairo');
    const rawCairoCode = fs.readFileSync(pathToFile, { encoding: 'utf8' });
    const funcNames = parseMultipleRawCairoFunctions(rawCairoCode).map(({ name }) => name);
    return { fileName, funcNames };
  })
  // TODO: Remove this filter once all warplib modules use cairo1
  .filter(({ funcNames }) => funcNames.length > 0)
  .map(({ fileName, funcNames }) => {
    const useFuncNames = funcNames.map((name) => `use ${fileName}::${name};`).join('\n');
    return `mod ${fileName};\n${useFuncNames}`;
  })
  .join('\n\n');

fs.writeFileSync(
  path.join(PATH_TO_WARPLIB, 'maths.cairo'),
  endent`
    // AUTO-GENERATED
    ${mathsContent}
  `,
);
