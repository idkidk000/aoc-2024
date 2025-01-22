#!/usr/bin/env -S deno --allow-read
// #region base aoc template
const Maths = Math;

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
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => ({
      a: new Set<string>(line.slice(0, Maths.floor(line.length / 2))),
      b: new Set<string>(line.slice(Maths.floor(line.length / 2))),
    }));

const part1 = () => {
  const bags = parseInput();
  debug(1, bags);
  const priorities = bags.map((bag) => {
    const [item] = [...bag.a.intersection(bag.b)];
    const charCode = item.charCodeAt(0);
    const value = charCode <= 90 ? charCode - 38 : charCode - 96;
    return { item, value };
  });
  debug(1, priorities);
  const result = priorities.reduce((acc, item) => acc + item.value, 0);
  console.log('part 1:', result);
};

const part2 = () => {
  const groupItems = parseInput()
    .map((item) => item.a.union(item.b))
    .map((item, i, arr) => item.intersection(arr[i + 1] ?? new Set()).intersection(arr[i + 2] ?? new Set()))
    .filter((_, i) => i % 3 === 0)
    .map((items) => {
      const [item] = [...items];
      return item;
    });
  debug(1, groupItems);
  const priorities = groupItems.map((item) => {
    const charCode = item.charCodeAt(0);
    const value = charCode <= 90 ? charCode - 38 : charCode - 96;
    return { item, value };
  });
  debug(1, priorities);
  const result = priorities.reduce((acc, item) => acc + item.value, 0);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
