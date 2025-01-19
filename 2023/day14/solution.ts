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
  sub = (value: Coord) => new Coord(this.r - value.r, this.c - value.c);
  mul = (value: number) => new Coord(this.r * value, this.c * value);
  div = (value: number) => new Coord(Maths.floor(this.r / value), Maths.floor(this.c / value));
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

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

const parseInput = () => new Grid(input.split('\n').filter((line) => line.trim()));

const part1 = () => {
  const grid = parseInput();
  if (args.debug) grid.print();
  let load = 0;
  for (const [c, col] of grid.cols()) {
    let moveTo = 0;
    debug(2, { c, col });
    for (const [r, char] of col.entries()) {
      if (char == '#') moveTo = r + 1;
      else if (char == 'O') {
        debug(3, { r, c, char, moveTo });
        grid.set(r, c, '.');
        grid.set(moveTo, c, 'O');
        load += grid.rowCount - moveTo;
        ++moveTo;
      }
    }
  }
  if (args.debug) grid.print();
  console.log('part 1:', load);
};

const part2 = () => {
  const grid = parseInput();
  /*
    the simulation falls into a loop after no more than r*c cycles
    checksum O positions and store in map
    simulate until checksum in map
    determine cycle length, start offset, etc. return load at cycle index
  */
  const simulate = () => {
    const checksumToCycle = new Map<number, number>();
    const cycleToLoad = new Map<number, number>();
    for (let cycle = 0; cycle < grid.rowCount * grid.colCount; ++cycle) {
      let [checksum, load] = [0, 0];
      for (let direction = 0; direction < 4; ++direction) {
        //TODO: this can be reduced to an up/down and a left/right block
        if (direction == 0) {
          // up
          for (const [c, col] of grid.cols()) {
            let moveTo = 0;
            for (const [r, char] of col.entries()) {
              if (char == '#') moveTo = r + 1;
              else if (char == 'O') {
                grid.set(r, c, '.');
                grid.set(moveTo, c, 'O');
                ++moveTo;
              }
            }
          }
        } else if (direction == 1) {
          // left
          for (const [r, row] of grid.rows()) {
            let moveTo = 0;
            for (const [c, char] of row.entries()) {
              if (char == '#') moveTo = c + 1;
              else if (char == 'O') {
                grid.set(r, c, '.');
                grid.set(r, moveTo, 'O');
                ++moveTo;
              }
            }
          }
        } else if (direction == 2) {
          // down
          for (const [c, col] of grid.cols()) {
            let moveTo = grid.rowCount - 1;
            for (const [ir, char] of col.toReversed().entries()) {
              const r = grid.rowCount - ir - 1;
              if (char == '#') moveTo = r - 1;
              else if (char == 'O') {
                grid.set(r, c, '.');
                grid.set(moveTo, c, 'O');
                --moveTo;
              }
            }
          }
        } else if (direction == 3) {
          // right
          for (const [r, row] of grid.rows()) {
            let moveTo = grid.colCount - 1;
            for (const [ic, char] of row.toReversed().entries()) {
              const c = grid.colCount - ic - 1;
              if (char == '#') moveTo = c - 1;
              else if (char == 'O') {
                grid.set(r, c, '.');
                grid.set(r, moveTo, 'O');
                // also update load and checksum
                load += grid.rowCount - r;
                checksum += r * 71 + moveTo * 1523;
                --moveTo;
              }
            }
          }
        }
      }
      if (checksumToCycle.has(checksum)) return { cycleEnd: cycle, cycleStart: checksumToCycle.get(checksum)!, cycleToLoad };
      checksumToCycle.set(checksum, cycle);
      cycleToLoad.set(cycle, load);
    }
    throw new Error('bruh');
  };
  const { cycleStart, cycleEnd, cycleToLoad } = simulate();
  debug(2, { cycleToLoad });
  const cycleLength = cycleEnd - cycleStart;
  const cycleIndex = ((1_000_000_000 - cycleStart) % cycleLength) + cycleStart - 1;
  const result = cycleToLoad.get(cycleIndex);
  debug(1, { cycleStart, cycleEnd, cycleLength, cycleIndex, result });
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
