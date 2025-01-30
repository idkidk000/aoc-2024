#!/usr/bin/env -S deno --allow-read
// #region base aoc template
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

interface Coord {
  r: number;
  c: number;
}

// deno-lint-ignore no-namespace
namespace CoordUtils {
  const colBits = 16;
  const colAdd = 0;
  const colMask = (1 << colBits) - 1;
  export const pack = (value: Coord) => (value.r << colBits) + value.c + colAdd;
  export const unpack = (value: number): Coord => ({ r: value >> colBits, c: (value & colMask) - colAdd });
  export const add = (...values: Array<Coord>): Coord =>
    values.slice(1).reduce((acc, item) => ({ r: acc.r + item.r, c: acc.c + item.c }), values[0]);
  export const eq = (left: Coord, right: Coord) => left.r === right.r && left.c === right.c;
}

class CoordSet extends Set<number> {
  constructor(iterable?: Iterable<Coord>) {
    super(iterable ? Array.from(iterable, CoordUtils.pack) : undefined);
  }
  override add(value: Coord | number) {
    return super.add(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  override has(value: Coord | number) {
    return super.has(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  override delete(value: Coord | number) {
    return super.delete(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  update(iterable: Iterable<Coord | number>) {
    for (const value of iterable) this.add(value);
  }
  differenceUpdate(iterable: Iterable<Coord | number>) {
    for (const value of iterable) this.delete(value);
  }
  coordValues() {
    return super.values().map((item) => CoordUtils.unpack(item));
  }
}

class Deque<T> {
  private ring: T[];
  #front: number = 0;
  #back: number = 0;
  #length: number;
  constructor(length: number) {
    this.#length = length;
    this.ring = new Array<T>(length);
    Object.defineProperties(this, {
      pushFront: { value: this.pushFront, enumerable: false },
      pushBack: { value: this.pushBack, enumerable: false },
      popFront: { value: this.popFront, enumerable: false },
      popBack: { value: this.popBack, enumerable: false },
    });
  }
  get size(): number {
    return (this.#length - this.#front + this.#back) % this.#length;
  }
  get empty(): boolean {
    return this.#front === this.#back;
  }
  pushFront = (...items: T[]) => {
    for (const item of items) {
      this.#front = (this.#front - 1 + this.#length) % this.#length;
      if (this.#front == this.#back) throw new Error('bruh');
      this.ring[this.#front] = item;
    }
  };
  pushBack = (...items: T[]) => {
    for (const item of items) {
      this.ring[this.#back] = item;
      this.#back = (this.#back + 1) % this.#length;
      if (this.#front == this.#back) throw new Error('bruh');
    }
  };
  popFront = () => {
    const item = this.ring[this.#front];
    delete this.ring[this.#front];
    this.#front = (this.#front + 1) % this.#length;
    return item;
  };
  popBack = () => {
    this.#back = (this.#back - 1 + this.#length) % this.#length;
    const item = this.ring[this.#back];
    delete this.ring[this.#back];
    return item;
  };
}

class HeapQueue<T> {
  private heap: T[] = [];
  #comparator: (a: T, b: T) => number;
  constructor(comparator: (a: T, b: T) => number) {
    this.#comparator = comparator;
    Object.defineProperties(this, {
      push: { value: this.push, enumerable: false },
      pop: { value: this.pop, enumerable: false },
    });
  }
  get size(): number {
    return this.heap.length;
  }
  get empty(): boolean {
    return this.heap.length === 0;
  }
  push = (value: T) => {
    this.heap.push(value);
    this.#siftUp();
  };
  pop = () => {
    if (this.size === 0) return undefined;
    const top = this.heap[0];
    const end = this.heap.pop()!;
    if (this.size > 0) {
      this.heap[0] = end;
      this.#siftDown();
    }
    return top;
  };
  #siftUp = () => {
    let idx = this.size - 1;
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.#comparator(element, parent) >= 0) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = element;
  };
  #siftDown = () => {
    let idx = 0;
    const length = this.size;
    const element = this.heap[0];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = -1;

      if (leftIdx < length && this.#comparator(this.heap[leftIdx], element) < 0) {
        swapIdx = leftIdx;
      }
      if (rightIdx < length && this.#comparator(this.heap[rightIdx], this.heap[swapIdx === -1 ? idx : leftIdx]) < 0) {
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
// #endregion

const parseInput = () => {};

const solve = () => {};

const part1 = () => {};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();