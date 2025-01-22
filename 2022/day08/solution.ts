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

const parseInput = () => {
  const grid = Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('').map((char) => Number(char)));
  const [rows, cols] = [grid.length, grid[0].length];
  return { grid, rows, cols };
};

const part1 = () => {
  const { grid, rows, cols } = parseInput();
  const visible = new Set<number>();
  const addVisible = (r: number, c: number) => {
    debug(1, 'visible', { r, c });
    visible.add((r << 8) + c);
  };
  for (let r = 0; r < rows; ++r) {
    let highest = -1;
    for (let c = 0; c < cols; ++c) {
      const item = grid[r][c];
      if (item > highest) {
        addVisible(r, c);
        highest = item;
      }
      if (item === 9) break;
    }
    highest = -1;
    for (let c = cols - 1; c >= 0; --c) {
      const item = grid[r][c];
      if (item > highest) {
        addVisible(r, c);
        highest = item;
      }
      if (item === 9) break;
    }
  }
  for (let c = 0; c < cols; ++c) {
    let highest = -1;
    for (let r = 0; r < rows; ++r) {
      const item = grid[r][c];
      if (item > highest) {
        addVisible(r, c);
        highest = item;
      }
      if (item === 9) break;
    }
    highest = -1;
    for (let r = rows - 1; r >= 0; --r) {
      const item = grid[r][c];
      if (item > highest) {
        addVisible(r, c);
        highest = item;
      }
      if (item === 9) break;
    }
  }
  const countVisible = visible.size;
  console.log('part 1:', countVisible);
};

const part2 = () => {
  const { grid, rows, cols } = parseInput();
  let highestScore = 0;
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      const thisHeight = grid[r][c];
      const score = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ]
        .map(([dr, dc]) => {
          let distance = 0;
          for (let i = 1; i < Maths.max(rows, cols); ++i) {
            const [nr, nc] = [r + dr * i, c + dc * i];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
            ++distance;
            const treeHeight = grid[nr][nc];
            if (treeHeight >= thisHeight) break;
          }
          return distance;
        })
        .reduce((acc, item) => acc * item, 1);
      debug(1, { r, c, score });
      highestScore = Maths.max(highestScore, score);
    }
  }
  console.log('part 2:', highestScore);
};

if (args.part1) part1();
if (args.part2) part2();
