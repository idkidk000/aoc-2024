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
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n\n')
    .filter((section) => section.trim())
    .map((section) =>
      section
        .split('\n')
        .map((line) => Number(line))
        .reduce((acc, item) => acc + item)
    )
    .toSorted((a, b) => b - a);

const part1 = () => {
  const result = parseInput()[0];
  console.log('part 1:', result);
};

const part2 = () => {
  const result = parseInput()
    .slice(0, 3)
    .reduce((acc, item) => acc + item, 0);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
