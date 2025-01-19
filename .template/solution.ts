#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    clamp(value: number, min: number, max: number): number;
    gcd(left: number, right: number): number;
    lcm(values: number[]): number;
    pmod(value: number, mod: number): number;
  }
}

Math.clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), min);
Math.gcd = (left: number, right: number) => {
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};
Math.lcm = (values: number[]) => values.reduce((acc, item) => (acc * item) / Math.gcd(acc, item), 1);
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

// similar to unordered_set and unordered_map in c++
class HashedSet<K, H> {
  //TODO: make hashfn optional if K has .hash(). might need to be a separate class
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

class Deque<T> {
  private ring: T[];
  private front: number = 0;
  private back: number = 0;
  constructor(public length: number) {
    this.ring = new Array<T>(length);
  }
  pushFront = (...items: T[]) => {
    for (const item of items) {
      this.front = (this.front - 1 + this.length) % this.length;
      if (this.front == this.back) throw new Error('bruh');
      this.ring[this.front] = item;
    }
  };
  pushBack = (...items: T[]) => {
    for (const item of items) {
      this.ring[this.back] = item;
      this.back = (this.back + 1) % this.length;
      if (this.front == this.back) throw new Error('bruh');
    }
  };
  popFront = () => {
    const item = this.ring[this.front];
    this.front = (this.front + 1) % this.length;
    return item;
  };
  popBack = () => {
    this.back = (this.back - 1 + this.length) % this.length;
    return this.ring[this.back];
  };
  empty = () => this.front == this.back;
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

const parseInput = () => new Grid(input.split('\n').filter((line) => line.trim()));

const part1 = () => {};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
