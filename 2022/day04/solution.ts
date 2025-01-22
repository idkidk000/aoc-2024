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
    .matchAll(/^(\d+)-(\d+),(\d+)-(\d+)$/gm)
    .map((tokens) => ({
      a: { from: Number(tokens[1]), to: Number(tokens[2]) },
      b: { from: Number(tokens[3]), to: Number(tokens[4]) },
    }))
    .toArray();

const part1 = () => {
  const enclosed = parseInput().filter(
    (item) => (item.a.from <= item.b.from && item.a.to >= item.b.to) || (item.b.from <= item.a.from && item.b.to >= item.a.to)
  );
  debug(1, enclosed);
  const result = enclosed.length;
  console.log('part 1:', result);
};

const part2 = () => {
  const overlap = parseInput().filter(
    (item) => (item.a.from <= item.b.to && item.a.to >= item.b.from) || (item.b.from <= item.a.to && item.b.to >= item.a.from)
  );
  debug(1, overlap);
  const result = overlap.length;
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
