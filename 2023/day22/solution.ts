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

class HashedSet<K, H> {
  //FIXME: send some time writing this properly and benchmarking
  private map: Map<H, K>;
  private hashFn: (key: K) => H;
  private hashSet: Set<H>;
  constructor(hashFn: (key: K) => H, iterable?: Iterable<K>, public readonly readOnly = false) {
    this.hashFn = hashFn;
    if (typeof iterable !== 'undefined') {
      this.map = new Map<H, K>(Array.from(iterable).map((item) => [this.hashFn(item), item]));
    } else {
      this.map = new Map<H, K>();
    }
    this.hashSet = new Set<H>(this.map.keys());
  }
  add = (key: K) => {
    if (this.readOnly) throw new Error('do not');
    const hash = this.hashFn(key);
    this.map.set(hash, key);
    this.hashSet.add(hash);
  };
  clear = () => {
    if (this.readOnly) throw new Error('do not');
    this.map.clear();
    this.hashSet.clear();
  };
  delete = (key: K) => {
    if (this.readOnly) throw new Error('do not');
    this.map.delete(this.hashFn(key));
    this.hashSet.clear();
  };
  has = (key: K) => this.map.has(this.hashFn(key));
  get size() {
    return this.map.size;
  }
  values = () => this.map.values();
  hashes = () => this.hashSet.values();

  //TODO: add more methods
  intersection = (other: HashedSet<K, H>) =>
    new HashedSet<K, H>(
      this.hashFn,
      this.hashSet
        .intersection(other.hashSet)
        .values()
        .map((hash) => this.map.get(hash)!)
    );
  intersects = (other: HashedSet<K, H>) => this.hashSet.intersection(other.hashSet).size > 0;
  [Symbol.iterator]() {
    return this.values();
  }
}

class HashedMap<K, V, H> {
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
  get size() {
    return this.map.size;
  }
  values = () => this.map.values().map((v) => v.value);
  entries = () => this.map.values().map((v) => [v.key, v.value]);
  [Symbol.iterator]() {
    return this.entries();
  }
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

interface Vec3 {
  x: number;
  y: number;
  z: number;
}
interface Vec2 {
  x: number;
  y: number;
}
class Brick {
  private _c0: Vec3;
  private _c1: Vec3;
  public xy: HashedSet<Vec2, number>;
  constructor(public readonly id: number, c0: Vec3, c1: Vec3) {
    [this._c0, this._c1] = [c0, c1];
    const xys = new Array<Vec2>();
    for (let x = Maths.min(c0.x, c1.x); x <= Maths.max(c0.x, c1.x); ++x) {
      for (let y = Maths.min(c0.y, c1.y); y <= Maths.max(c0.y, c1.y); ++y) {
        xys.push({ x, y });
      }
    }
    this.xy = new HashedSet<Vec2, number>((key) => (key.x << 8) + key.y, xys, true);
  }
  get top(): number {
    return Maths.max(this._c0.z, this._c1.z);
  }
  get bottom(): number {
    return Maths.min(this._c0.z, this._c1.z);
  }
  moveZ = (value: number): void => {
    this._c0.z += value;
    this._c1.z += value;
  };
}

const parseInput = () =>
  input
    .matchAll(/^(\d+),(\d+),(\d+)~(\d+),(\d+),(\d+)$/gm)
    .map<Brick>((match, i) => {
      const [_, c0xStr, c0yStr, c0zStr, c1xStr, c1yStr, c1zStr] = match;
      return new Brick(
        i,
        { x: Number(c0xStr), y: Number(c0yStr), z: Number(c0zStr) },
        { x: Number(c1xStr), y: Number(c1yStr), z: Number(c1zStr) }
      );
    })
    .toArray();

// by val so we don't update the original... though maybe the array entries are still passed by ref idk
const dropBricks = (...bricks: Brick[]) => {
  const heights = new HashedMap<Vec2, number, number>((key) => (key.x << 8) + key.y);
  bricks.sort((a, b) => a.bottom - b.bottom);
  for (const brick of bricks) {
    const zBelow = brick.xy.values().reduce((acc, item) => Maths.max(heights.get(item) ?? 0, acc), 0);
    const moveBy = zBelow - brick.bottom + 1;
    debug(1, 'found', { brick, zBelow, moveBy });
    brick.moveZ(moveBy);
    debug(1, 'dropped', { brick });
    for (const xy of brick.xy) heights.set(xy, brick.top);
  }
  return bricks;
};

const part1 = () => {
  const bricks = dropBricks(...parseInput());

  const possibilities = new HashedSet<Brick, number>((key) => key.id, bricks);
  for (const above of bricks) {
    const belows = bricks.filter((below) => below.top === above.bottom - 1 && below.xy.intersects(above.xy));
    debug(1, { above, belows });
    // remove below from possibilities if there is exactly one
    if (belows.length === 1) belows.forEach((below) => possibilities.delete(below));
  }

  console.log('part 1:', possibilities.size);
};

const part2 = () => {
  const bricks = dropBricks(...parseInput());

  // refactor bricks into a more useful format
  interface BrickMap {
    aboves: Set<number>;
    belows: Set<number>;
  }
  const brickMap = new Map<number, BrickMap>(
    bricks.map((brick) => [
      brick.id,
      {
        aboves: new Set(
          bricks.filter((above) => above.bottom === brick.top + 1 && above.xy.intersects(brick.xy)).map((above) => above.id)
        ),
        belows: new Set(
          bricks.filter((below) => below.top === brick.bottom - 1 && below.xy.intersects(brick.xy)).map((below) => below.id)
        ),
      },
    ])
  );

  // then just keep looping over fallen and removing aboves with no non-fallen belows until we find no more
  let total = 0;
  for (const removed of brickMap.keys()) {
    const fallen = new Set<number>([removed]);
    let found = true;
    while (found) {
      found = false;
      for (const brick of fallen) {
        for (const above of brickMap.get(brick)!.aboves) {
          if (fallen.has(above)) continue;
          if (brickMap.get(above)!.belows.difference(fallen).size === 0) {
            fallen.add(above);
            found = true;
          }
        }
      }
    }
    total += fallen.size - 1; // don't include removed brick
  }

  console.log('part 2:', total);
};

if (args.part1) part1();
if (args.part2) part2();
