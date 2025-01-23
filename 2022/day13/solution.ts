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

type Packet = number | Array<number | Packet>;
interface Pair {
  a: Packet;
  b: Packet;
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Packet)
    .reduce((acc, item, i, arr) => {
      if (i % 2 === 0) acc.push({ a: item, b: arr[i + 1] });
      return acc;
    }, new Array<Pair>());

const getSortOrder = (pair: Pair): number => {
  // deliberately avoiding naming this compair
  if (typeof pair.a === 'number' && typeof pair.b === 'number') return pair.a - pair.b;
  else if (typeof pair.a === 'number') return getSortOrder({ ...pair, a: [pair.a] });
  else if (typeof pair.b === 'number') return getSortOrder({ ...pair, b: [pair.b] });
  else {
    for (let i = 0; i < Maths.max(pair.a.length, pair.b.length); ++i) {
      if (i === pair.a.length) return -1;
      if (i === pair.b.length) return 1;
      const result = getSortOrder({ a: pair.a[i], b: pair.b[i] });
      if (result !== 0) return result;
    }
  }
  return 0;
};

const part1 = () => {
  const pairs = parseInput();
  debug(2, pairs);
  const correctCount = pairs.reduce((acc, item, i) => {
    const sorted = getSortOrder(item);
    debug(1, { index: i + 1, item, sorted });
    return acc + (sorted <= 0 ? i + 1 : 0);
  }, 0);
  console.log('part 1:', correctCount);
};

const part2 = () => {
  const dividerPackets = new Array<Packet>([[2]], [[6]]);
  const sorted = [...parseInput().flatMap((item) => [item.a, item.b]), ...dividerPackets].toSorted((a, b) =>
    getSortOrder({ a, b })
  );
  debug(1, sorted);
  const search = dividerPackets.map((item) => JSON.stringify(item)); //ugh
  const decoderKey = sorted.reduce((acc: number, item, i) => acc * (search.includes(JSON.stringify(item)) ? i + 1 : 1), 1);
  debug(1, { search, decoderKey });
  console.log('part 2:', decoderKey);
};

if (args.part1) part1();
if (args.part2) part2();
