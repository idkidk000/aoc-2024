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

class HashedSet<K, H> {
  // hopefully not too slow but we'll see
  private map = new Map<H, K>();
  private hashFn: (key: K) => H;
  constructor(hashFn: (key: K) => H, iterable?: Iterable<K>) {
    this.hashFn = hashFn;
    if (iterable) {
      for (const k of iterable) {
        this.map.set(this.hashFn(k), k);
      }
    }
  }
  add(key: K): void {
    this.map.set(this.hashFn(key), key);
  }
  has(key: K): boolean {
    return this.map.has(this.hashFn(key));
  }
  values(): MapIterator<K> {
    return this.map.values();
  }
  size(): number {
    return this.map.size;
  }
}

class Tile {
  constructor(public r: number, public c: number) {}
  add(other: Tile): Tile {
    return new Tile(this.r + other.r, this.c + other.c);
  }
}

const D4 = [new Tile(-1, 0), new Tile(0, 1), new Tile(1, 0), new Tile(0, -1)];
const ENTRY = new Map<string, number[]>([
  ['|', [0, 2]],
  ['-', [1, 3]],
  ['L', [2, 3]],
  ['J', [2, 1]],
  ['7', [0, 1]],
  ['F', [0, 3]],
  ['S', [0, 1, 2, 3]],
]);
const EXIT = new Map<string, number[]>(ENTRY.entries().map(([k, v]) => [k, v.map((e) => (e + 2) % 4)]));

const input = await Deno.readTextFile(FILENAME);

const parseInput = () => {
  const grid = input.split('\n').filter((line) => line.trim());
  const rows = grid.length;
  const cols = grid[0].length;
  const gridFind = (search: string) => {
    for (const [r, row] of grid.entries()) {
      for (const [c, char] of row.split('').entries()) {
        if (char == search) return new Tile(r, c);
      }
    }
    throw new Error('bruh');
  };
  return { grid, rows, cols, start: gridFind('S') };
};

const findPath = (grid: string[], rows: number, cols: number, start: Tile) => {
  // standard aoc path walk with some additional direction constraints
  const path = new HashedSet<Tile, string>((key) => `${key.r},${key.c}`);
  path.add(start);
  const queue: Tile[] = [start];
  while (queue.length) {
    const tile = queue.shift()!;
    for (const direction of EXIT.get(grid[tile.r][tile.c])!) {
      const nextTile = tile.add(D4[direction]);
      if (nextTile.r < 0 || nextTile.r >= rows || nextTile.c < 0 || nextTile.c >= cols || path.has(nextTile)) continue;
      if (!(ENTRY.get(grid[nextTile.r][nextTile.c]) ?? []).includes(direction)) continue;
      path.add(nextTile);
      queue.push(nextTile);
    }
  }
  return path;
};

const part1 = () => {
  const { grid, rows, cols, start } = parseInput();
  debug(1, { grid, rows, cols, start });
  const path = findPath(grid, rows, cols, start);
  debug(1, { path });
  console.log('part 1:', Maths.floor(path.size() / 2));
};

const part2 = () => {
  const { grid, rows, cols, start } = parseInput();
  const path = findPath(grid, rows, cols, start);
  // replace S so it won't interfere with our row scan
  const startDirections: number[] = [];
  for (const [direction, offset] of D4.entries()) {
    const nextTile = start.add(offset);
    if (
      nextTile.r < 0 ||
      nextTile.c >= rows ||
      nextTile.c < 0 ||
      nextTile.c >= cols ||
      !path.has(nextTile) ||
      !ENTRY.get(grid[nextTile.r][nextTile.c])!.includes(direction)
    )
      continue;
    startDirections.push(direction);
  }
  const inferred = new Map(EXIT.entries().map(([k, v]) => [v.toSorted().join(','), k])).get(startDirections.join(','))!;
  debug(1, { startDirections, inferred });
  // grid scan, flip isInternal on path tiles with an up direction. add isInternal non-path tiles to set (map actually but shush)
  grid[start.r] = grid[start.r]
    .split('')
    .map((item, i) => (i == start.c ? inferred : item))
    .join('');
  const internal = new HashedSet<Tile, string>((key) => `${key.r},${key.c}`);
  for (const [r, row] of grid.entries()) {
    let isInternal = false;
    for (const [c, char] of row.split('').entries()) {
      const tile = new Tile(r, c);
      debug(2, { char, tile });
      if (path.has(tile)) {
        if (ENTRY.get(char)!.includes(0)) isInternal = !isInternal;
      } else if (isInternal) {
        internal.add(tile);
      }
    }
  }
  debug(1, { internal });
  console.log('part 2:', internal.size());
};

if (PART1) part1();
if (PART2) part2();
