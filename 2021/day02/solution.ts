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

const args = new Args();
// #endregion

type Direction = 'forward' | 'up' | 'down';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/))
    .map((tokens) => ({
      direction: tokens[0] as Direction,
      value: Number(tokens[1]),
    }));

const part1 = () => {
  const position = parseInput().reduce(
    (acc, { direction, value }) => {
      direction === 'up' ? (acc.y -= value) : direction === 'down' ? (acc.y += value) : (acc.x += value);
      return acc;
    },
    { x: 0, y: 0 }
  );
  const result = position.x * position.y;
  console.log('part 1:', result);
};

const part2 = () => {
  const position = parseInput().reduce(
    (acc, { direction, value }) => {
      direction === 'up'
        ? (acc.a -= value)
        : direction === 'down'
        ? (acc.a += value)
        : ((acc.x += value), (acc.y += acc.a * value));
      return acc;
    },
    { x: 0, y: 0, a: 0 }
  );
  const result = position.x * position.y;
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
