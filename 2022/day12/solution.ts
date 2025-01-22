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
interface Coord {
  r: number;
  c: number;
}
interface GridData {
  grid: Array<Array<number>>;
  rows: number;
  cols: number;
  start: Coord;
  end: Coord;
}
const D4: Coord[] = [
  { r: -1, c: 0 },
  { r: 0, c: 1 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
];
const parseInput = (): GridData => {
  const convert = (char: string) => char.charCodeAt(0) - 97;
  const grid = Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('').map((token) => convert(token)));
  const [rows, cols] = [grid.length, grid[0].length];
  let start!: Coord, end!: Coord;
  const [replacedS, replacedE] = [convert('S'), convert('E')];
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      const item = grid[r][c];
      if (item === replacedS) {
        start = { r, c };
        grid[r][c] = convert('a');
      } else if (item === replacedE) {
        end = { r, c };
        grid[r][c] = convert('z');
      }
    }
  }
  if (!start || !end) throw new Error('bruh');
  debug(2, { grid, rows, cols });
  return { grid, rows, cols, start, end };
};

const solve = ({ grid, rows, cols, start, end }: GridData) => {
  // seeing how far i can get without rolling out my template classes
  interface QueueEntry {
    coord: Coord;
    cost: number;
  }
  const queue = new Array<QueueEntry>();
  const tileCosts = new Map<number, number>();
  const addTileCost = (coord: Coord, cost: number) => {
    const hash = (coord.r << 8) + coord.c;
    if ((tileCosts.get(hash) ?? Infinity) <= cost) return false;
    tileCosts.set(hash, cost);
    return true;
  };
  const coordAdd = (left: Coord, right: Coord): Coord => ({ r: left.r + right.r, c: left.c + right.c });
  const coordEq = (left: Coord, right: Coord) => left.r === right.r && left.c === right.c;
  queue.push({ coord: start, cost: 0 });
  addTileCost(start, 0);
  let lowestCost = Infinity;
  while (queue.length) {
    const { coord, cost } = queue.shift()!; // not great, but pop would be dfs which is very much not what we want here
    debug(2, { coord, cost, lowestCost, qlen: queue.length });
    if (cost >= lowestCost) continue;
    const elevation = grid[coord.r][coord.c];
    for (const offset of D4) {
      const nextCoord = coordAdd(coord, offset);
      const nextCost = cost + 1;
      if (
        nextCoord.r < 0 ||
        nextCoord.r >= rows ||
        nextCoord.c < 0 ||
        nextCoord.c >= cols ||
        grid[nextCoord.r][nextCoord.c] > elevation + 1 ||
        !addTileCost(nextCoord, nextCost)
      )
        continue;
      if (coordEq(nextCoord, end)) lowestCost = Maths.min(lowestCost, nextCost);
      else queue.push({ coord: nextCoord, cost: nextCost });
    }
  }
  debug(1, { start, lowestCost });
  return lowestCost;
};

const part1 = () => {
  const gridData = parseInput();
  const result = solve(gridData);
  console.log('part 1:', result);
};

const part2 = () => {
  const gridData = parseInput();
  const startCoords = new Array<Coord>();
  for (let r = 0; r < gridData.rows; ++r) {
    for (let c = 0; c < gridData.cols; ++c) {
      if (gridData.grid[r][c] === 0) {
        startCoords.push({ r, c });
      }
    }
  }
  const lowestCost = startCoords
    .map((start) => solve({ ...gridData, start }))
    .reduce((acc, item) => Maths.min(acc, item), Infinity);
  console.log('part 2:', lowestCost);
};

if (args.part1) part1();
if (args.part2) part2();
