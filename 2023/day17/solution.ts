#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    pmod(value: number, mod: number): number;
  }
}

Math.pmod = (value: number, mod: number) => {
  const result = value % mod;
  return result >= 0 ? result : result + mod;
};

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
  eq = (other: Coord) => this.r == other.r && this.c == other.c;
  // only uncomment if needed since their existance hurts performance
  /*   sub = (value: Coord) => new Coord(this.r - value.r, this.c - value.c);
  mul = (value: number) => new Coord(this.r * value, this.c * value);
  div = (value: number) => new Coord(Maths.floor(this.r / value), Maths.floor(this.c / value)); */
}

//TODO: update template with generic grid
class Grid<T> {
  rowCount: number;
  colCount: number;
  data: T[]; //grid is flattened into an array of single chars
  directions = [new Coord(-1, 0), new Coord(0, 1), new Coord(1, 0), new Coord(0, -1)];

  constructor(data: string[], parseCallback: (cell: string) => T = (cell) => cell as unknown as T) {
    [this.rowCount, this.colCount] = [data.length, data[0].length];
    this.data = data.flatMap((row) => row.split('').map((cell) => parseCallback(cell)));
  }

  rcToIndex = (r: number, c: number) => r * this.colCount + c;
  coordToIndex = (coord: Coord) => this.rcToIndex(coord.r, coord.c);
  indexToCoord = (index: number) => new Coord(Maths.floor(index / this.colCount), index % this.colCount);

  find = (value: T) => this.indexToCoord(this.data.findIndex((v) => v === value)!);
  findLast = (value: T) => this.indexToCoord(this.data.findLastIndex((v) => v === value)!);

  // good type hints for overloaded methods require ye olde fashionde syntax and the type checking is a disaster
  oob(coord: Coord): boolean;
  oob(r: number, c: number): boolean;
  oob(p0: Coord | number, p1?: number): boolean {
    if (p0 instanceof Coord) return p0.r < 0 || p0.r >= this.rowCount || p0.c < 0 || p0.c >= this.colCount;
    if (typeof p1 === 'number') return p0 < 0 || p0 >= this.rowCount || p1 < 0 || p1 >= this.rowCount;
    throw new Error('bruh');
  }

  set(coord: Coord, value: T): T;
  set(r: number, c: number, value: T): T;
  set(p0: Coord | number, p1: T | number, p2?: T): T {
    if (p0 instanceof Coord) return (this.data[this.coordToIndex(p0)] = p1 as T);
    if (typeof p0 === 'number' && typeof p1 === 'number' && typeof p2 !== 'undefined')
      return (this.data[this.rcToIndex(p0, p1)] = p2);
    throw new Error('bruh');
  }

  get(coord: Coord): T;
  get(r: number, c: number): T;
  get(p0: Coord | number, p1?: number) {
    if (p0 instanceof Coord) return this.data[this.coordToIndex(p0)];
    if (typeof p0 === 'number' && typeof p1 === 'number') return this.data[this.rcToIndex(p0, p1)];
    throw new Error('bruh');
  }

  row = (index: number) => this.data.slice(index * this.colCount, (index + 1) * this.colCount);
  col = (index: number) => {
    // faster than array.from() with a callback but much more verbose
    const result = new Array<T>(this.rowCount);
    for (let i = 0; i < this.rowCount; ++i) result[i] = this.data[this.rcToIndex(i, index)];
    return result;
  };
  rows = () => {
    //faster than a generator
    const result = new Array<[number, T[]]>(this.rowCount);
    for (let i = 0; i < this.rowCount; ++i) result[i] = [i, this.row(i)];
    return result;
  };
  cols = () => {
    const result = new Array<[number, T[]]>(this.colCount);
    for (let i = 0; i < this.colCount; ++i) result[i] = [i, this.col(i)];
    return result;
  };
  print = (highlight?: { r: number; c: number; colour?: number; value?: T }[]) => {
    if (typeof highlight !== 'undefined') {
      // the slow version
      const hashed = new Map<number, { colour: number; value: T | undefined }>(
        highlight.map((item) => [item.r * 71 + item.c * 7919, { colour: item.colour ?? 0, value: item.value }])
      );
      for (const [r, row] of this.rows())
        console.log(
          `${r.toString().padStart(3, ' ')}: ${row
            .map((cell, c) => {
              const highlight = hashed.get(r * 71 + c * 7919);
              return highlight ? `\x1b[7;${31 + highlight.colour}m${highlight.value ?? cell}\x1b[0m` : cell;
            })
            .join('')}`
        );
    } else for (const [r, row] of this.rows()) console.log(`${r.toString().padStart(3, ' ')}: ${row.join('')}`);
  };
}

class HashedMap<K, V, H> {
  // key and value are stored in the private map's value so the unhashed key can be retrieved later
  private map: Map<H, { key: K; value: V }>;
  constructor(public hashFn: (key: K) => H, iterable?: Iterable<readonly [K, V]>) {
    if (typeof iterable !== 'undefined') {
      this.map = new Map<H, { key: K; value: V }>(Array.from(iterable).map(([key, value]) => [this.hashFn(key), { key, value }]));
    } else {
      this.map = new Map<H, { key: K; value: V }>();
    }
  }
  clear = () => this.map.clear();
  delete = (key: K) => this.map.delete(this.hashFn(key));
  get = (key: K) => this.map.get(this.hashFn(key))?.value;
  has = (key: K) => this.map.has(this.hashFn(key));
  keys = () => this.map.values().map((v) => v.key);
  set = (key: K, value: V) => this.map.set(this.hashFn(key), { key, value });
  size = () => this.map.size;
  values = () => this.map.values().map((v) => v.value);
}

//FIXME: this is just a copy-pasted implementation to test with
class BinaryHeap<T> {
  private heap: T[] = [];
  constructor(public comparator: (a: T, b: T) => number) {}
  get size(): number {
    return this.heap.length;
  }
  push = (value: T) => {
    this.heap.push(value);
    this.siftUp();
  };
  pop = () => {
    if (this.size === 0) return undefined;
    const top = this.heap[0];
    const end = this.heap.pop()!;
    if (this.size > 0) {
      this.heap[0] = end;
      this.siftDown();
    }
    return top;
  };
  private siftUp = () => {
    let idx = this.size - 1;
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.comparator(element, parent) >= 0) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = element;
  };
  private siftDown = () => {
    let idx = 0;
    const length = this.size;
    const element = this.heap[0];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = -1;

      if (leftIdx < length && this.comparator(this.heap[leftIdx], element) < 0) {
        swapIdx = leftIdx;
      }
      if (rightIdx < length && this.comparator(this.heap[rightIdx], this.heap[swapIdx === -1 ? idx : leftIdx]) < 0) {
        swapIdx = rightIdx;
      }
      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = element;
  };
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

const parseInput = () =>
  new Grid(
    input.split('\n').filter((line) => line.trim()),
    (cell) => Number(cell)
  );

const simulate = (grid: Grid<number>) => {
  const end = new Coord(grid.rowCount - 1, grid.colCount - 1);
  interface WalkedEntry {
    coord: Coord;
    dir: number;
    streak: number;
  }
  const walked = new HashedMap<WalkedEntry, number, number>(
    // official wikipedia prime number page enjoyer
    (key) => key.coord.r * 173 + key.coord.c * 1811 + key.dir * 7723 + key.streak * 7919
  );
  interface QueueEntry extends WalkedEntry {
    cost: number;
    history: WalkedEntry[]; //FIXME: remove once working
  }
  //FIXME: BinaryHeap is a copy-paste job. write a better version when this works
  const queue = new BinaryHeap<QueueEntry>((a, b) => a.cost - b.cost);
  const start: WalkedEntry = { coord: new Coord(0, 0), dir: 1, streak: 0 };
  queue.push({ ...start, cost: 0, history: [start] });
  walked.set(start, 0);
  let lowestCost = Infinity;
  let cheapestPath: WalkedEntry[] = [];
  while (queue.size) {
    const { coord, dir, streak, cost, history } = queue.pop()!;
    // debug(2, { coord, dir, streak, cost });
    for (const turn of [-1, 0, 1]) {
      if (streak === 3 && turn === 0) continue; //must turn after 3 steps
      const nextDir = Maths.pmod(dir + turn, 4);
      const nextCoord = coord.add(grid.directions[nextDir]);
      if (grid.oob(nextCoord)) continue;
      const nextWalked: WalkedEntry = { coord: nextCoord, dir: nextDir, streak: turn === 0 ? streak + 1 : 1 };
      const nextCost = cost + grid.get(nextCoord);
      if (Maths.min(walked.get(nextWalked) ?? Infinity, lowestCost) <= nextCost) continue;
      const nextQueue: QueueEntry = { ...nextWalked, cost: nextCost, history: [...history, nextWalked] };
      if (end.eq(nextCoord)) {
        debug(1, 'completed', nextQueue);
        lowestCost = nextCost; //we already pruned lowestCost<=nextCost
        cheapestPath = nextQueue.history;
      } else {
        walked.set(nextWalked, nextCost);
        queue.push(nextQueue);
      }
    }
  }
  grid.print(cheapestPath.map((item) => ({ ...item.coord, colour: item.dir, value: item.streak })));
  return lowestCost;
};

const part1 = () => {
  const result = simulate(parseInput());
  console.log('part 1:', result);
  // it's a LOT faster than the python solve but it's also wrong :)
  //BUG: returns 861, should be 859
  //works correctly on example and example2 (which is just a chunk of input.txt i used for py testing) ofc
};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
