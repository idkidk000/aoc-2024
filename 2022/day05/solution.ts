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

const parseInput = () => {
  // good parsing problem for day 5 tbh
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');

  const stacks = new Map<number, Array<string>>();
  sections[0]
    .split('\n')
    .map((line) => line.split('').filter((_, i) => (i - 1) % 4 === 0))
    .toReversed()
    .slice(1)
    .forEach((row) => {
      row.forEach((crate, i) => {
        if (crate !== ' ') stacks.has(i + 1) ? stacks.get(i + 1)!.push(crate) : stacks.set(i + 1, new Array<string>(crate));
      });
    });
  debug(3, stacks);

  const procedures = sections[1]
    .matchAll(/^move (\d+) from (\d+) to (\d+)$/gm)
    .map((tokens) => ({
      count: Number(tokens[1]),
      from: Number(tokens[2]),
      to: Number(tokens[3]),
    }))
    .toArray();
  debug(3, procedures);

  return { stacks, procedures };
};

const part1 = () => {
  const { stacks, procedures } = parseInput();
  for (const procedure of procedures) {
    for (let i = 0; i < procedure.count; ++i) stacks.get(procedure.to)!.push(stacks.get(procedure.from)!.pop()!);
    debug(1, procedure, stacks);
  }
  const topCrates = stacks.values().reduce((acc, item) => acc + item.slice(-1)[0], '');
  console.log('part 1:', topCrates);
};

const part2 = () => {
  const { stacks, procedures } = parseInput();
  for (const procedure of procedures) {
    stacks.get(procedure.to!)?.push(...stacks.get(procedure.from)!.splice(-procedure.count, procedure.count));
    debug(1, procedure, stacks);
  }
  const topCrates = stacks.values().reduce((acc, item) => acc + item.slice(-1)[0], '');
  console.log('part 1:', topCrates);
};

if (args.part1) part1();
if (args.part2) part2();
