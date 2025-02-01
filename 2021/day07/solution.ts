#!/usr/bin/env -S deno --allow-read
import { args, debug, Maths } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/\d+/g)
    .map((token) => Number(token))
    .toArray();

const solve = (values: Array<number>, increasing = false) => {
  // i feel like i'm missing something obvious here
  let [lowest, bestI] = [Infinity, Infinity];
  for (let i = Maths.min(...values); i <= Maths.max(...values); ++i) {
    const result = values.reduce((acc, item) => {
      const diff = Maths.abs(i - item);
      const diff2 = increasing ? diff * ((diff - 1) / 2 + 1) : diff;
      debug(3, { item, i, diff, diff2, acc });
      return acc + diff2;
    }, 0);
    debug(2, { i, result });
    if (result < lowest) [lowest, bestI] = [result, i];
  }
  debug(1, { values, lowest, bestI });
  return lowest;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(parseInput(), true);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
