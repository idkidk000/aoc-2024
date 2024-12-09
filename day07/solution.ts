#!/usr/bin/env -S deno --allow-read

// const DEBUG = true;
const DEBUG = false;

const text = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(text);

const calculations = text
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => {
    const [target, values] = line.split(/:\s+/);
    return {
      target: parseInt(target),
      values: values.split(/\s+/).map((value) => parseInt(value)),
    };
  });
if (DEBUG) console.debug(calculations);

let total1 = 0;
calculations.forEach((calculation) => {
  const results: Set<number> = new Set();
  calculation.values.forEach((value, ix) => {
    if (ix) {
      const temp = [...results];
      results.clear();
      temp.forEach((result) => {
        results.add(result * value);
        results.add(result + value);
      });
    } else {
      results.add(value);
    }
  });
  const success = results.has(calculation.target);
  if (DEBUG) console.debug(calculations, success);
  if (success) total1 += calculation.target;
});
console.log('part 1', total1);

let total2 = 0;
calculations.forEach((calculation) => {
  const results: Set<number> = new Set();
  calculation.values.forEach((value, ix) => {
    if (ix) {
      const temp = [...results];
      results.clear();
      temp.forEach((result) => {
        results.add(result * value);
        results.add(result + value);
        results.add(parseInt(`${result}${value}`));
      });
    } else {
      results.add(value);
    }
  });
  const success = results.has(calculation.target);
  if (DEBUG) console.debug(calculations, success);
  if (success) total2 += calculation.target;
});
console.log('part 2', total2);
