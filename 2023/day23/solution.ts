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
  eq = (other: Coord) => this.r == other.r && this.c == other.c;
  toString = () => `Coord: { r: \x1b[33m${this.r}\x1b[0m, c: \x1b[33m${this.c}\x1b[0m }`;
  toJSON = () => ({ r: this.r, c: this.c });
  [Symbol.for('Deno.customInspect')]() {
    return this.toString();
  }
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
  toString = () =>
    `HashedSet {\n  values: [\n    ${this.map
      .values()
      .map((item) => JSON.stringify(item))
      .toArray()
      .join(',\n    ')}\n  ],\n  size: ${this.map.size}\n}`;
  // toString = () => {
  //   `HashedSet {\n  values: [ ${this.map
  //     .values()
  //     .map((item) => JSON.stringify(item))
  //     .toArray()
  //     .join(', ')} ],\n  size: ${this.map.size}\n}`;
  // };
  // toJSON = () => ({ entries: this.values().toArray(), size: this.map.size });
  // toJSON = () => this.toString();
  [Symbol.for('Deno.customInspect')]() {
    return this.toString();
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
  toString = () =>
    `HashedMap {\n  entries: [\n    ${this.entries()
      .map((item) => JSON.stringify(item))
      .toArray()
      .join(',\n    ')}\n  ],\n  size: ${this.map.size}\n}`;
  toJSON = () => ({ entries: this.entries().toArray(), size: this.map.size });
  [Symbol.for('Deno.customInspect')]() {
    // return JSON.stringify(this.toJSON());
    return this.toString();
  }
}

class Deque<T> {
  private ring: T[];
  private front: number = 0;
  private back: number = 0;
  constructor(public readonly length: number) {
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
  get empty() {
    return this.front === this.back;
  }
  get size() {
    return this.length - this.front + this.back;
  }
}

//FIXME: yes, i still need to write my own
class BinaryHeap<T> {
  private heap: T[] = [];
  constructor(public comparator: (a: T, b: T) => number) {}
  get size(): number {
    return this.heap.length;
  }
  get empty(): boolean {
    return this.heap.length === 0;
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

const parseInput = () => new Grid(input.split('\n').filter((line) => line.trim()));

const solve = (grid: Grid, enableSlopes = true) => {
  const [startNode, endNode] = [grid.find('.'), grid.findLast('.')];
  // find the nodes (start, end, junctions)
  const nodes = new HashedSet<Coord, number>((key) => (key.r << 8) + key.c, [startNode, endNode]);
  for (const [r, row] of grid.rows()) {
    for (const [c, char] of row.entries()) {
      if (char === '#') continue;
      const coord = new Coord(r, c);
      const count = grid.directions
        .map((offset) => coord.add(offset))
        .reduce((acc, item) => acc + (grid.oob(item) || grid.get(item) === '#' ? 0 : 1), 0);
      debug(2, { coord, count });
      if (count > 2) nodes.add(coord);
    }
  }
  debug(1, nodes, nodes.size);

  const slopeMap = new Map<string, number>([
    ['^', 0],
    ['>', 1],
    ['v', 2],
    ['<', 3],
  ]);

  interface MapEntry {
    node: Coord;
    cost: number;
  }

  // walk each node and map its neighbours
  const nodeMap = new HashedMap<Coord, HashedSet<MapEntry, number>, number>((key) => (key.r << 8) + key.c);
  for (const node of nodes) {
    const queue = new Deque<MapEntry>(1000);
    const walked = new HashedSet<Coord, number>((key) => (key.r << 8) + key.c);
    queue.pushBack({ node: node, cost: 0 });
    walked.add(node);
    nodeMap.set(node, new HashedSet<MapEntry, number>((key) => (key.node.r << 8) + key.node.c));
    while (!queue.empty) {
      const { node: thisNode, cost } = queue.popFront();
      // debug(2, { thisNode, cost });
      for (const [direction, offset] of grid.directions.entries()) {
        const nextNode = thisNode.add(offset);
        // debug(3, { nextNode });
        if (grid.oob(nextNode)) continue;
        const charAt = grid.get(nextNode);
        if (charAt === '#') continue;
        const allowedDirection = slopeMap.get(charAt);
        if (typeof allowedDirection !== 'undefined' && enableSlopes && allowedDirection !== direction) continue;
        if (walked.has(nextNode)) continue;
        const mapEntry = { node: nextNode, cost: cost + 1 };
        if (nodes.has(nextNode)) {
          debug(1, 'found', { nextNode });
          nodeMap.get(node)!.add(mapEntry);
        } else {
          queue.pushFront(mapEntry);
          walked.add(nextNode);
        }
      }
    }
  }

  for (const [k, v] of nodeMap.entries()) {
    debug(1, { k, v });
  }

  // now walk the nodeMap and find the longest path from startNode to endNode
  // storing "walked" on the queue AND CREATING A NEW INSTANCE FOR EACH STEP is very unfortunate and i don't see a way around it
  interface QueueEntry {
    node: Coord;
    walked: HashedSet<Coord, number>;
    cost: number;
  }
  const queue = new BinaryHeap<QueueEntry>((a, b) => b.cost - a.cost);
  //FIXME: coord hashes in regular number sets would be faster
  //FIXME: i'm still missing some optimisation but i can't think of a way to prune paths or even set a break condition
  // queue.push({ node: startNode, cost: 0 });
  // const walked = new HashedSet<Coord, number>((key) => (key.r << 8) + key.c, [startNode]);
  queue.push({ node: startNode, walked: new HashedSet<Coord, number>((key) => (key.r << 8) + key.c, [startNode]), cost: 0 });
  let highestCost = 0;
  while (!queue.empty) {
    const { node, walked, cost } = queue.pop()!;
    // const { node, cost } = queue.pop()!;
    for (const { node: nextNode, cost: nodeCost } of nodeMap.get(node)!) {
      if (walked.has(nextNode)) continue;
      const nextCost = cost + nodeCost;
      if (endNode.eq(nextNode)) {
        debug(nextCost > highestCost ? 1 : 2, 'end', { nextCost, highestCost, qsize: queue.size });
        highestCost = Maths.max(highestCost, nextCost);
      } else {
        // walked.add(nextNode);
        queue.push({
          node: nextNode,
          walked: new HashedSet<Coord, number>((key) => (key.r << 8) + key.c, [...walked, nextNode]), //grim
          cost: nextCost,
        });
      }
    }
  }

  return highestCost;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(parseInput(), false);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
