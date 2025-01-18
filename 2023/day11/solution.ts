#!/usr/bin/env -S deno --allow-read

const Maths = Math;

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

const parseInput = () => {
  interface Coord {
    r: number;
    c: number;
  }
  const grid = input
    .split('\n')
    .filter((line) => line.trim())
    .map((row) => row.split(''));
  const galaxies: Coord[] = [];
  for (const [r, row] of grid.entries()) {
    for (const [c, char] of row.entries()) {
      if (char == '#') galaxies.push({ r, c });
    }
  }
  const occupiedRows = new Set(galaxies.map((g) => g.r));
  const occupiedCols = new Set(galaxies.map((g) => g.c));
  debug(1, { galaxies, occupiedRows, occupiedCols });
  return { grid, galaxies, occupiedRows, occupiedCols };
};

const range = (from: number, to: number) => {
  // generators are quite slow so we'll just return an array
  const result: number[] = [];
  for (let i = from; i < to; ++i) result.push(i);
  return result;
};

const solve = (expansion: number) => {
  const { galaxies, occupiedRows, occupiedCols } = parseInput();
  const distances: number[] = [];

  for (const [i, left] of galaxies.entries()) {
    for (const right of galaxies.slice(i + 1)) {
      const [rMin, rMax, cMin, cMax] = [
        Maths.min(left.r, right.r),
        Maths.max(left.r, right.r),
        Maths.min(left.c, right.c),
        Maths.max(left.c, right.c),
      ];
      const distance =
        rMax -
        rMin +
        cMax -
        cMin +
        range(rMin + 1, rMax).filter((v) => !occupiedRows.has(v)).length * (expansion - 1) +
        range(cMin + 1, cMax).filter((v) => !occupiedCols.has(v)).length * (expansion - 1);
      distances.push(distance);
      debug(2, { left, right, distance });
    }
  }

  return distances.reduce((acc, item) => acc + item, 0);
};

const part1 = () => {
  const result = solve(2);
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(1_000_000);
  console.log('part 2:', result);
};

if (PART1) part1();
if (PART2) part2();
