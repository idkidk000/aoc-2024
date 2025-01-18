#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item.startsWith('-d') ? Number(item.slice(2) || '1') : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) => (item == '-i' ? 'input.txt' : item.startsWith('-e') ? `example${item.slice(2)}.txt` : acc),
  'example.txt'
);
const [PART1, PART2] = Deno.args.reduce(
  (acc, item) => (item == '-p0' ? [false, false] : item == '-p1' ? [true, false] : item == '-p2' ? [false, true] : acc),
  [true, true]
);

console.log({ FILENAME, DEBUG, PART1, PART2 });

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (DEBUG >= level) console.debug(...data);
};

const input = await Deno.readTextFile(FILENAME);

const parseInput = () =>
  input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/).map((token) => Number(token)));

const extrapolate = (row: number[]): number[] => {
  // this is definitely a clowncar approach but it's fast enough so w/e
  // solved something similar for some of the tile counts in 2023d21

  const deltas: number[][] = [row];
  // expand deltas until all same value
  while (new Set(deltas.slice(-1)[0]).size > 1) {
    deltas.push(
      deltas
        .slice(-1)[0]
        .map((value, i, row) => row[i + 1] - value)
        .slice(0, -1)
    );
  }
  // push extrapolated values
  let prevValue = 0;
  for (let i = deltas.length - 1; i > -1; --i) {
    const newValue = prevValue + deltas[i].slice(-1)[0];
    deltas[i].push(newValue);
    prevValue = newValue;
  }
  debug(1, { deltas });
  // return the first level (i.e row with an extrapolated value)
  return deltas[0];
};

const part1 = () => {
  const data = parseInput();
  const total = data.map((row) => extrapolate(row)).reduce((acc, row) => acc + row.slice(-1)[0], 0);
  console.log('part 1:', total);
};

const part2 = () => {
  const data = parseInput();
  const total = data.map((row) => extrapolate(row.toReversed())).reduce((acc, row) => acc + row.slice(-1)[0], 0);
  console.log('part 2:', total);
};

if (PART1) part1();
if (PART2) part2();
