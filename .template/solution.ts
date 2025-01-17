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
// deno-lint-ignore no-unused-vars
const D4 = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (DEBUG >= level) console.debug(...data);
};

const input = await Deno.readTextFile(FILENAME);

const parseInput = () => {
  const grid = input.split('\n').filter((line) => line.trim());
  const rows = grid.length;
  const cols = grid[0].length;
  let startAt, endAt;
  for (let rowIx = 0; rowIx < rows; rowIx++) {
    for (let colIx = 0; colIx < cols; colIx++) {
      switch (grid[rowIx][colIx]) {
        case 'S':
          startAt = [rowIx, colIx];
          break;
        case 'E':
          endAt = [rowIx, colIx];
          break;
      }
    }
  }
  if (typeof startAt === 'undefined' || typeof endAt === 'undefined') {
    throw new Error(`could not find start and end pos startAt=${startAt}, endAt=${endAt}`);
  }
  return { grid, rows, cols, startAt, endAt };
};

const drawGrid = (grid: string[]) => {
  for (let rowIx = 0; rowIx < grid.length; rowIx++) {
    console.log(`${String(rowIx).padStart(3, ' ')}:  ${grid[rowIx]}`);
  }
};

const part1 = () => {};
const part2 = () => {};

const { grid, rows, cols, startAt, endAt } = parseInput();
if (DEBUG) drawGrid(grid);
debug(1, { rows, cols, startAt, endAt });
if (PART1) part1();
if (PART2) part2();