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

class Coord {
  constructor(public r: number, public c: number) {}
  add = (value: Coord) => new Coord(this.r + value.r, this.c + value.c);
}

class Grid {
  rowCount: number;
  colCount: number;
  data: string[]; //grid is flattened into an array of single chars
  directions = [new Coord(-1, 0), new Coord(0, 1), new Coord(1, 0), new Coord(0, -1)];

  constructor(data: string[]) {
    [this.rowCount, this.colCount] = [data.length, data[0].length];
    this.data = data.flatMap((row) => row.split(''));
  }

  rcToIndex = (r: number, c: number) => r * this.colCount + c;
  coordToIndex = (coord: Coord) => this.rcToIndex(coord.r, coord.c);
  indexToCoord = (index: number) => new Coord(Maths.floor(index / this.colCount), index % this.colCount);

  find = (value: string) => this.indexToCoord(this.data.findIndex((v) => v === value)!);
  findLast = (value: string) => this.indexToCoord(this.data.findLastIndex((v) => v === value)!);

  // good type hints for overloaded methods require ye olde fashionde syntax and the type checking is a disaster
  oob(coord: Coord): boolean;
  oob(r: number, c: number): boolean;
  oob(p0: Coord | number, p1?: number): boolean {
    if (p0 instanceof Coord) return p0.r < 0 || p0.r >= this.rowCount || p0.c < 0 || p0.c >= this.colCount;
    if (typeof p1 === 'string') return p0 < 0 || p0 >= this.rowCount || p1 < 0 || p1 >= this.rowCount;
    throw new Error('bruh');
  }

  set(coord: Coord, value: string): string;
  set(r: number, c: number, value: string): string;
  set(p0: Coord | number, p1: string | number, p2?: string): string {
    if (p0 instanceof Coord && typeof p1 === 'string') return (this.data[this.coordToIndex(p0)] = p1);
    if (typeof p0 === 'number' && typeof p1 === 'number' && typeof p2 === 'string')
      return (this.data[this.rcToIndex(p0, p1)] = p2);
    throw new Error('bruh');
  }

  get(coord: Coord): string;
  get(r: number, c: number): string;
  get(p0: Coord | number, p1?: number) {
    if (p0 instanceof Coord) return this.data[this.coordToIndex(p0)];
    if (typeof p0 === 'number' && typeof p1 === 'number') return this.data[this.rcToIndex(p0, p1)];
    throw new Error('bruh');
  }

  row = (index: number) => this.data.slice(index * this.colCount, (index + 1) * this.colCount);
  col = (index: number) => {
    // faster than array.from() with a callback but much more verbose
    const result = new Array<string>(this.rowCount);
    for (let i = 0; i < this.rowCount; ++i) result[i] = this.data[this.rcToIndex(i, index)];
    return result;
  };
  rows = () => {
    //faster than a generator
    const result = new Array<[number, string[]]>(this.rowCount);
    for (let i = 0; i < this.rowCount; ++i) result[i] = [i, this.row(i)];
    return result;
  };
  cols = () => {
    const result = new Array<[number, string[]]>(this.colCount);
    for (let i = 0; i < this.colCount; ++i) result[i] = [i, this.col(i)];
    return result;
  };
  print = () => {
    for (const [r, row] of this.rows()) console.log(`${r.toString().padStart(3, ' ')}: ${row.join('')}`);
  };
  rotate = () => {
    const result = new Array<string>(); //no size since we need to push to it rather than assign
    for (const [_, col] of this.cols()) result.push(...col);
    return new Grid(result);
  };
}

class HashedSet<K, H> {
  private map: Map<H, K>;
  constructor(public hashFn: (key: K) => H, iterable?: Iterable<K>) {
    if (typeof iterable !== 'undefined') {
      this.map = new Map<H, K>(Array.from(iterable).map((item) => [this.hashFn(item), item]));
    } else {
      this.map = new Map<H, K>();
    }
  }
  add = (key: K) => this.map.set(this.hashFn(key), key);
  clear = () => this.map.clear();
  delete = (key: K) => this.map.delete(this.hashFn(key));
  has = (key: K) => this.map.has(this.hashFn(key));
  size = () => this.map.size;
  values = () => this.map.values();
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

const parseInput = () => new Grid(input.split('\n').filter((line) => line.trim()));

const countReachable = (grid: Grid, start: Coord, steps: number) => {
  debug(1, { start, steps });
  const queues = Array.from({ length: 2 }, () => new HashedSet<Coord, number>((key) => (key.r << 8) + key.c));
  queues[0].add(start);
  for (let i = 0; i < steps; ++i) {
    for (const currentCoord of queues[0].values()) {
      for (const offset of grid.directions) {
        const nextCoord = currentCoord.add(offset);
        if (grid.oob(nextCoord) || grid.get(nextCoord) === '#') continue;
        queues[1].add(nextCoord);
      }
    }
    // swap refs and clear next
    debug(2, { i, prev: queues[0].size(), this: queues[1].size() });
    [queues[0], queues[1]] = [queues[1], queues[0]];
    queues[1].clear();
  }
  return queues[0].size();
};

const part1 = () => {
  const grid = parseInput();
  const result = countReachable(grid, grid.find('S'), 64);
  console.log('part 1:', result);
};

const part2 = () => {
  // copied from my python solve since this was fun exactly once
  // walk each tile type, calculate multipliers, and sum
  const grid = parseInput();
  const startCoord = grid.find('S');
  const totalSteps = 26_501_365;
  if (grid.rowCount !== grid.colCount) throw new Error('bruh');

  const gridSize = grid.rowCount;
  const gridSizeHalf = Maths.floor(gridSize / 2);
  const orthagonalSteps = totalSteps - 1 - gridSizeHalf;
  const diagonalSteps = totalSteps - 1 - gridSize;

  // the two filled tile states
  const countCenter = countReachable(grid, startCoord, Maths.min(totalSteps, gridSize * 2 + (totalSteps % 2)));
  const countFilled = countReachable(grid, startCoord, gridSize * 2 + (totalSteps % 2) + 1);

  // steps<gridSize (low fill)
  const countCornersA =
    countReachable(grid, new Coord(gridSize - 1, startCoord.c), orthagonalSteps % gridSize) +
    countReachable(grid, new Coord(startCoord.r, 0), orthagonalSteps % gridSize) +
    countReachable(grid, new Coord(0, startCoord.c), orthagonalSteps % gridSize) +
    countReachable(grid, new Coord(startCoord.r, gridSize - 1), orthagonalSteps % gridSize);

  // steps<gridSize*2 (high fill)
  const countCornersB =
    countReachable(grid, new Coord(gridSize - 1, startCoord.c), (orthagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(startCoord.r, 0), (orthagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(0, startCoord.c), (orthagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(startCoord.r, gridSize - 1), (orthagonalSteps % gridSize) + gridSize);

  // steps<gridSize (low fill)
  const countEdgesA =
    countReachable(grid, new Coord(gridSize - 1, 0), diagonalSteps % gridSize) +
    countReachable(grid, new Coord(0, 0), diagonalSteps % gridSize) +
    countReachable(grid, new Coord(0, gridSize - 1), diagonalSteps % gridSize) +
    countReachable(grid, new Coord(gridSize - 1, gridSize - 1), diagonalSteps % gridSize);

  // steps<gridSize*2 (high fill)
  const countEdgesB =
    countReachable(grid, new Coord(gridSize - 1, 0), (diagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(0, 0), (diagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(0, gridSize - 1), (diagonalSteps % gridSize) + gridSize) +
    countReachable(grid, new Coord(gridSize - 1, gridSize - 1), (diagonalSteps % gridSize) + gridSize);

  let countTotal = countCenter;
  debug(1, 'add', { countCenter, countTotal });
  if (totalSteps > gridSizeHalf) {
    countTotal += countCornersA;
    debug(1, 'add', { countCornersA, countTotal });
  }
  if (totalSteps > gridSize + gridSizeHalf) {
    countTotal += countCornersB;
    debug(1, 'add', { countCornersB, countTotal });
  }
  if (totalSteps > gridSize) {
    const multiplier = Maths.floor((totalSteps - 1) / gridSize);
    countTotal += countEdgesA * multiplier;
    debug(1, 'add', { countEdgesA, multiplier, countTotal });
  }
  if (totalSteps > gridSize * 2) {
    const multiplier = Maths.floor((totalSteps - 1) / gridSize) - 1;
    countTotal += countEdgesB * multiplier;
    debug(1, 'add', { countEdgesB, multiplier, countTotal });
  }
  if (totalSteps > gridSize * 2 + gridSizeHalf) {
    const multiplier =
      4 * Maths.floor((totalSteps - 1) / (gridSize * 2)) ** 2 - 4 + ((totalSteps - 1) % (gridSize * 2) >= gridSizeHalf ? 4 : 0);
    countTotal += countFilled * multiplier;
    debug(1, 'add', { countFilled, multiplier, countTotal });
  }
  if (totalSteps > gridSize * 3) {
    const n = Maths.floor(Maths.floor((totalSteps - 1) / gridSize - 1) / 2);
    const multiplier = 4 * (n ** 2 + n) - 4 + ((totalSteps - 1 + gridSize) % (gridSize * 2) >= gridSizeHalf ? 4 : 0);
    countTotal += countCenter * multiplier;
    debug(1, 'add', { countCenter, multiplier, n, countTotal });
  }

  console.log('part 2:', countTotal);
};

if (args.part1) part1();
if (args.part2) part2();
