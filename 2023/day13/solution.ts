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

const parseInput = () => input.split('\n\n').map((section) => section.split('\n').filter((line) => line.trim()));

const findReflection = (grid: string[], rotate: boolean, smudge: boolean) => {
  if (rotate) grid = grid[0].split('').map((_, i) => grid.map((row) => row[i]).join(''));
  debug(1, { grid, rotate, smudge, length: grid.length });
  // above starts at r, below starts at r+1. oob here would be matched
  for (let r = 0; r < grid.length - 1; ++r) {
    let [smudged, matched] = [false, true];
    for (let i = 0; i < grid.length; ++i) {
      const [aboveIndex, belowIndex] = [r - i, r + i + 1];
      debug(3, { r, i, aboveIndex, belowIndex, smudged });
      if (aboveIndex < 0 || belowIndex >= grid.length) break;
      const [above, below] = [grid[aboveIndex], grid[belowIndex]];
      if (above != below) {
        // check if 1 char different
        if (smudge && !smudged && above.split('').reduce((acc, c, i) => (c == below[i] ? acc : acc + 1), 0) == 1) {
          smudged = true;
          debug(2, { smudged });
        } else {
          matched = false;
          debug(2, { matched });
          break;
        }
      } else {
        debug(3, { matched, above, below });
      }
    }
    if (matched && (!smudge || (smudge && smudged))) {
      debug(2, 'match at', r + 1);
      return r + 1;
    }
  }
  // success is always >0
  return 0;
};

const part1 = () => {
  const total = parseInput().reduce(
    (acc, grid) => acc + (findReflection(grid, false, false)! * 100 || findReflection(grid, true, false))!,
    0
  );
  console.log('part 1:', total);
};

const part2 = () => {
  const total = parseInput().reduce(
    (acc, grid) => acc + (findReflection(grid, false, true)! * 100 || findReflection(grid, true, true))!,
    0
  );
  console.log('part 2:', total);
};

if (PART1) part1();
if (PART2) part2();
