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

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((token) => Number(token));

const part1 = () => {
  const result = parseInput().reduce((acc, item, i, arr) => acc + (i > 0 && item > arr[i - 1] ? 1 : 0), 0);
  console.log('part 1:', result);
};

const part2 = () => {
  const result = parseInput()
    .map((item, i, arr) => (i > 1 ? item + arr[i - 1] + arr[i - 2] : undefined))
    .filter((item) => item !== undefined)
    .reduce((acc, item, i, arr) => acc + (i > 0 && item > arr[i - 1] ? 1 : 0), 0);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
