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

const solve = (input: Array<number>, iterations: number = 80) => {
  const counter = new Map<number, number>();
  const updateCounter = (key: number, count: number) => counter.set(key, (counter.get(key) ?? 0) + count);
  for (const key of input) updateCounter(key, 1);
  for (let i = 0; i < iterations; ++i) {
    for (const [key, count] of counter.entries().toArray()) {
      updateCounter(key, -count);
      if (key === 0) {
        updateCounter(6, count);
        updateCounter(8, count);
      } else updateCounter(key - 1, count);
    }
    debug(1, { i, counter });
  }
  return counter.values().reduce((acc, item) => acc + item, 0);
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(parseInput(), 256);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
