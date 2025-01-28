#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    pmod(value: number, mod: number): number;
  }
}

Math.pmod = (value: number, mod: number) => {
  const result = value % mod;
  return result >= 0 ? result : result + mod;
};

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
  // values aren't unique so also store the original index
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line, ix) => ({ ix, value: Number(line) }));

interface Entry {
  ix: number;
  value: number;
}

const mix = (input: Array<Entry>, iterations = 1): number => {
  debug(1, 'start', input);
  const output = [...input];
  // all mixing rounds are in the done in the order of input
  for (let iteration = 0; iteration < iterations; ++iteration) {
    for (const moveItem of input) {
      const index = output.findIndex((item) => item.ix === moveItem.ix);
      if (index === -1) throw new Error(`not found moveItem=${moveItem} output=${JSON.stringify(output)}`);
      const nextIndex = Maths.pmod(index + moveItem.value, input.length - 1);
      // 10k array splices is quite terrible (100k even worse woo)
      //TODO: this could be reduced to a single splice where index<nextIndex
      output.splice(index, 1);
      output.splice(nextIndex, 0, moveItem);
      debug(2, { moveItem, index, nextIndex, output });
    }
    debug(1, 'end', { iteration }, output);
  }
  const index0 = output.findIndex((item) => item.value === 0);
  const coordinates = [
    output[(index0 + 1000) % output.length].value,
    output[(index0 + 2000) % output.length].value,
    output[(index0 + 3000) % output.length].value,
  ];
  debug(1, { index0, coordinates });
  const result = coordinates.reduce((acc, item) => acc + item, 0);
  return result;
};

const part1 = () => {
  const result = mix(parseInput());
  console.log('part 1:', result);

  // 1591
};

const part2 = () => {
  const result = mix(
    parseInput().map((item) => ({ ...item, value: item.value * 811589153 })),
    10
  );
  console.log('part 1:', result);

  // 14579387544492
};

if (args.part1) part1();
if (args.part2) part2();
