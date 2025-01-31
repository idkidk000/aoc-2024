#!/usr/bin/env -S deno --allow-read
// #region base aoc template
class Args {
  constructor(public filename = 'input.txt', public debug = 0, public part1 = true, public part2 = true) {
    for (const arg of Deno.args) {
      const [key, value] = [arg.slice(0, 2), (fallback = 0) => Number(arg.slice(2) || fallback)];
      if (key === '-d') debug = value(1);
      else if (key === '-e') filename = `example${arg.slice(2)}.txt`;
      else if (key === '-i') filename = 'input.txt';
      else if (key === '-p') [part1, part2] = [(value(0) & 1) === 1, (value(0) & 2) === 2];
      else throw new Error(`unrecognised arg="${arg}"`);
    }
    [this.filename, this.debug, this.part1, this.part2] = [filename, debug, part1, part2];
    console.log(`args: {filename: "${filename}", debug: ${debug}, part1: ${part1}, part2: ${part2} }`);
  }
}

const Maths = Math;

// deno-lint-ignore no-explicit-any
function debug(level: number, ...data: Array<any>): void {
  if (args.debug >= level)
    console.debug(
      ...data.map((item) =>
        item && typeof item === 'object' && Symbol.iterator in item && !('length' in item || 'size' in item)
          ? Array.from(item)
          : item
      )
    );
}

const args = new Args();
// #endregion

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
  console.log('part 1:', result);
};

if (args.part1) part1();
if (args.part2) part2();
