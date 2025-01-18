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

const parseInput = () =>
  input
    .split('\n')
    .filter((line) => line.trim())
    .map((row) => row.split(''));

const solve = (expansion: number) => {
  interface Coord {
    r: number;
    c: number;
  }

  const grid = parseInput();
  // bit grim tbh
  const galaxies: Coord[] = grid
    .flatMap((row, r) => row.map((char, c) => (char == '#' ? { r, c } : null)))
    .filter((g) => g != null);
  const occupiedRows = new Set(galaxies.map((g) => g.r));
  const occupiedCols = new Set(galaxies.map((g) => g.c));
  debug(1, { galaxies, occupiedRows, occupiedCols });
  const distances: number[] = [];
  for (let i = 0; i < galaxies.length; ++i) {
    const left = galaxies[i];
    for (let j = i + 1; j < galaxies.length; ++j) {
      const right = galaxies[j];
      let distance = Maths.abs(left.r - right.r) + Maths.abs(left.c - right.c);
      for (let k = Maths.min(left.r, right.r); k < Maths.max(left.r, right.r); ++k) {
        if (!occupiedRows.has(k)) distance += expansion - 1;
      }
      for (let k = Maths.min(left.c, right.c); k < Maths.max(left.c, right.c); ++k) {
        if (!occupiedCols.has(k)) distance += expansion - 1;
      }
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
  const result = solve(1_000_000_000);
  console.log('part 2:', result);
};

if (PART1) part1();
if (PART2) part2();
