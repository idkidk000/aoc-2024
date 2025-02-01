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

export const args = new Args();

// deno-lint-ignore no-explicit-any
export function debug(level: number, ...data: Array<any>): void {
  if (args.debug >= level)
    console.debug(
      ...data.map((item) =>
        item && typeof item === 'object' && Symbol.iterator in item && !('length' in item || 'size' in item)
          ? Array.from(item)
          : item
      )
    );
}

export const Maths = Math;

// deno-lint-ignore no-namespace
export namespace Maths2 {
  export function clamp(value: number, min: number, max: number): number {
    return Maths.max(Maths.min(value, max), min);
  }
  export function gcd(left: number, right: number): number {
    while (right !== 0) [left, right] = [right, left % right];
    return left;
  }
  export function lcm(...values: Array<number>): number {
    return values.reduce((acc, item) => (acc * item) / gcd(acc, item));
  }
  export function lerp(left: number, right: number, steps: number, step: number) {
    return left + ((right - left) / steps) * step;
  }
  export function lineIntersect(
    { x: x0, y: y0 }: Vec2,
    { x: x1, y: y1 }: Vec2,
    { x: x2, y: y2 }: Vec2,
    { x: x3, y: y3 }: Vec2,
    infinite: boolean = false
  ): Vec2 | undefined {
    const denominator = (x0 - x1) * (y2 - y3) - (y0 - y1) * (x2 - x3);
    if (denominator === 0) return undefined;
    const line0Distance = ((x0 - x2) * (y2 - y3) - (y0 - y2) * (x2 - x3)) / denominator;
    const line1Distance = ((x0 - x2) * (y0 - y1) - (y0 - y2) * (x0 - x1)) / denominator;
    return infinite || (line0Distance >= 0 && line0Distance <= 1 && line1Distance >= 0 && line1Distance <= 1)
      ? { x: x0 + line0Distance * (x1 - x0), y: y0 + line0Distance * (y1 - y0) }
      : undefined;
  }
  export function minMax(...values: Array<number>): [number, number] {
    return values.reduce((acc, item) => [Maths.min(acc[0], item), Maths.max(acc[1], item)], [Infinity, -Infinity]);
  }
  export function modP(value: number, mod: number): number {
    const result = value % mod;
    return result >= 0 ? result : result + mod;
  }
}

export interface Coord {
  r: number;
  c: number;
}

// deno-lint-ignore no-namespace
export namespace CoordUtils {
  const width = 16;
  const mask = (1 << width) - 1;
  const offset = 0;
  export function add(...values: Array<Coord>): Coord {
    return values.reduce((acc, item) => ({ r: acc.r + item.r, c: acc.c + item.c }));
  }
  export function eq(left: Coord, right: Coord): boolean {
    return left.r === right.r && left.c === right.c;
  }
  export function mult(value: Coord, multiplier: number): Coord {
    return { r: value.r * multiplier, c: value.c * multiplier };
  }
  export function oob(value: Coord, max: Coord, min: Coord = { r: 0, c: 0 }): boolean {
    return value.r < min.r || value.r > max.r || value.c < min.c || value.c > max.c;
  }
  export function pack(value: Coord): number {
    return ((value.r + offset) << width) | (value.c + offset);
  }
  export function unpack(value: number): Coord {
    return { r: (value >> width) - offset, c: (value & mask) - offset };
  }
  export const offsets = new Array<Coord>({ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 });
}

export class CoordC {
  constructor(public r: number, public c: number) {}
  add(...values: Array<CoordC>): CoordC {
    return values.reduce((acc, item) => new CoordC(acc.r + item.r, acc.c + item.c));
  }
  eq(value: CoordC): boolean {
    return this.r === value.r && this.c === value.c;
  }
  mult(value: number): CoordC {
    return new CoordC(this.r * value, this.c * value);
  }
  static oob(value: CoordC, min: CoordC, max: CoordC): boolean {
    return value.r >= min.r && value.r <= max.r && value.c >= min.c && value.c <= max.c;
  }
  static pack(value: CoordC): number {
    return (value.r << 16) | value.c;
  }
  static unpack(value: number): CoordC {
    return new CoordC(value >> 16, value & 0xffff);
  }
  static offsets = new Array<CoordC>(new CoordC(-1, 0), new CoordC(0, 1), new CoordC(1, 0), new CoordC(0, -1));
}

export interface Vec2 {
  x: number;
  y: number;
}

// deno-lint-ignore no-namespace
export namespace Vec2Utils {
  const width = 16;
  const mask = (1 << width) - 1;
  const offset = 0;
  export function add(...values: Array<Vec2>): Vec2 {
    return values.reduce((acc, item) => ({ x: acc.x + item.x, y: acc.y + item.y }));
  }
  export function eq(left: Vec2, right: Vec2): boolean {
    return left.x === right.x && left.y === right.y;
  }
  export function mult(value: Vec2, multiplier: number): Vec2 {
    return { x: value.x * multiplier, y: value.y * multiplier };
  }
  export function oob(value: Vec2, max: Vec2, min: Vec2 = { x: 0, y: 0 }): boolean {
    return value.x < min.x || value.x > max.x || value.y < min.y || value.y > max.y;
  }
  export function pack(value: Vec2): number {
    return ((value.x + offset) << width) | (value.y + offset);
  }
  export function unpack(value: number): Vec2 {
    return { x: (value >> width) - offset, y: (value & mask) - offset };
  }
}

export interface Line {
  a: Vec2;
  b: Vec2;
}

export class Vec2C {
  constructor(public x: number, public y: number) {}
  add(...values: Array<Vec2C>): Vec2C {
    return values.reduce((acc, item) => new Vec2C(acc.x + item.x, acc.y + item.y));
  }
  eq(value: Vec2C): boolean {
    return this.x === value.x && this.y === value.y;
  }
  mult(value: number): Vec2C {
    return new Vec2C(this.x * value, this.y * value);
  }
  static oob(value: Vec2C, min: Vec2C, max: Vec2C): boolean {
    return value.x >= min.x && value.x <= max.x && value.y >= min.y && value.y <= max.y;
  }
  static pack(value: Vec2C): number {
    return (value.x << 16) | value.y;
  }
  static unpack(value: number): Vec2C {
    return new Vec2C(value >> 16, value & 0xffff);
  }
  static offsets = new Array<Vec2C>(new Vec2C(0, -1), new Vec2C(1, 0), new Vec2C(0, 1), new Vec2C(-1, 0));
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// deno-lint-ignore no-namespace
export namespace Vec3Utils {
  const width = 10;
  const mask = (1 << width) - 1;
  const offset = 0;
  export function add(...values: Array<Vec3>): Vec3 {
    return values.reduce((acc, item) => ({ x: acc.x + item.x, y: acc.y + item.y, z: acc.z + item.z }));
  }
  export function eq(left: Vec3, right: Vec3): boolean {
    return left.x === right.x && left.y === right.y && left.z === right.z;
  }
  export function mult(value: Vec3, multiplier: number): Vec3 {
    return { x: value.x * multiplier, y: value.y * multiplier, z: value.z * multiplier };
  }
  export function oob(value: Vec3, max: Vec3, min: Vec3 = { x: 0, y: 0, z: 0 }): boolean {
    return value.x < min.x || value.x > max.x || value.y < min.y || value.y > max.y || value.z < min.z || value.z > max.z;
  }
  export function pack(value: Vec3): number {
    return ((value.x + offset) << (width * 2)) | ((value.y + offset) << width) | (value.z + offset);
  }
  export function unpack(value: number): Vec3 {
    return { x: (value >> (width * 2)) - offset, y: ((value >> width) & mask) - offset, z: (value & mask) - offset };
  }
}

export class Vec3C {
  constructor(public x: number, public y: number, public z: number) {}
  add(...values: Array<Vec3C>): Vec3C {
    return values.reduce((acc, item) => new Vec3C(acc.x + item.x, acc.y + item.y, acc.z + item.z));
  }
  eq(value: Vec3C): boolean {
    return this.x === value.x && this.y === value.y && this.z === value.z;
  }
  mult(value: number): Vec3C {
    return new Vec3C(this.x * value, this.y * value, this.z * value);
  }
  static oob(value: Vec3C, min: Vec3C, max: Vec3C): boolean {
    return value.x >= min.x && value.x <= max.x && value.y >= min.y && value.y <= max.y && value.z >= min.z && value.z <= max.z;
  }
  static pack(value: Vec3C, asBigInt: true): bigint;
  static pack(value: Vec3C, asBigInt?: false): number;
  static pack(value: Vec3C, asBigInt = false): bigint | number {
    return asBigInt
      ? (BigInt(value.x) << 32n) | (BigInt(value.y) << 16n) | BigInt(value.z)
      : (value.x << 20) | (value.y << 10) | value.z;
  }
  static unpack(value: bigint | number): Vec3C {
    return typeof value === 'bigint'
      ? new Vec3C(Number(value >> 32n), Number((value >> 16n) & 0xffffn), Number(value & 0xffffn))
      : new Vec3C(value >> 20, (value >> 10) & 0x3ff, value & 0x3ff);
  }
  static offsets = new Array<Vec3C>(
    new Vec3C(-1, 0, 0),
    new Vec3C(1, 0, 0),
    new Vec3C(0, -1, 0),
    new Vec3C(0, 1, 0),
    new Vec3C(0, 0, -1),
    new Vec3C(0, 0, 1)
  );
}

export class Deque<T> {
  private queue: Array<T>;
  #front: number = 0;
  #back: number = 0;
  #length: number;
  constructor(length: number) {
    this.#length = length;
    this.queue = new Array<T>(length);
    Object.defineProperties(this, {
      pushFront: { value: this.pushFront, enumerable: false },
      push: { value: this.push, enumerable: false },
      popFront: { value: this.popFront, enumerable: false },
      pop: { value: this.pop, enumerable: false },
    });
  }
  get size(): number {
    return (this.#length - this.#front + this.#back) % this.#length;
  }
  get empty(): boolean {
    return this.#front === this.#back;
  }
  pop(): T | undefined {
    if (this.empty) return undefined;
    this.#back = (this.#back - 1 + this.#length) % this.#length;
    const value = this.queue[this.#back];
    delete this.queue[this.#back];
    return value;
  }
  popFront(): T | undefined {
    if (this.empty) return undefined;
    const value = this.queue[this.#front];
    delete this.queue[this.#front];
    this.#front = (this.#front + 1) % this.#length;
    return value;
  }
  push(...values: Array<T>): this {
    for (const value of values) {
      this.queue[this.#back] = value;
      this.#back = (this.#back + 1) % this.#length;
      if (this.#front == this.#back) throw new Error('deque is full');
    }
    return this;
  }
  pushFront(...values: Array<T>): this {
    for (const value of values) {
      this.#front = (this.#front - 1 + this.#length) % this.#length;
      if (this.#front == this.#back) throw new Error('deque is full');
      this.queue[this.#front] = value;
    }
    return this;
  }
}

export class HeapQueue<T> {
  private queue = new Array<T>();
  #comparator: (a: T, b: T) => number;
  constructor(comparator: (a: T, b: T) => number) {
    this.#comparator = comparator;
    Object.defineProperties(this, {
      push: { value: this.push, enumerable: false },
      pop: { value: this.pop, enumerable: false },
    });
  }
  get size(): number {
    return this.queue.length;
  }
  get empty(): boolean {
    return this.queue.length === 0;
  }
  pop() {
    if (this.empty) return undefined;
    const front = this.queue[0];
    const back = this.queue.pop()!;
    if (this.size > 0) {
      this.queue[0] = back;
      this.#siftDown();
    }
    return front;
  }
  push(...values: Array<T>): this {
    for (const value of values) {
      this.queue.push(value);
      this.#siftUp();
    }
    return this;
  }
  #siftDown() {
    let itemIx = 0;
    const item = this.queue[0];
    while (true) {
      const leftIx = 2 * itemIx + 1;
      const rightIx = 2 * itemIx + 2;
      let swapIx = -1;
      if (leftIx < this.queue.length && this.#comparator(this.queue[leftIx], item) < 0) swapIx = leftIx;
      if (rightIx < this.queue.length && this.#comparator(this.queue[rightIx], this.queue[swapIx === -1 ? itemIx : leftIx]) < 0)
        swapIx = rightIx;
      if (swapIx === -1) break;
      this.queue[itemIx] = this.queue[swapIx];
      itemIx = swapIx;
    }
    this.queue[itemIx] = item;
  }
  #siftUp() {
    let itemIx = this.size - 1;
    const item = this.queue[itemIx];
    while (itemIx > 0) {
      const parentIx = Maths.floor((itemIx - 1) / 2);
      const parent = this.queue[parentIx];
      if (this.#comparator(item, parent) >= 0) break;
      this.queue[itemIx] = parent;
      itemIx = parentIx;
    }
    this.queue[itemIx] = item;
  }
}

export class Grid<T extends string | number | boolean> {
  #rows: number;
  #cols: number;
  private array: Array<T>;
  constructor(data: string, transformer?: (value: string) => T) {
    if (transformer === undefined && typeof ('' as T) !== 'string')
      throw new Error('transformer must be supplied for non-string types');
    const rows = data.split('\n').filter((line) => line.trim());
    this.array = rows
    .join('')
    .split('')
    .map((item) => (transformer !== undefined ? transformer(item) : item)) as Array<T>;
    this.#rows = rows.length;
    this.#cols = rows[0].length;
    Object.defineProperties(this, {
      find: { value: this.find, enumerable: false },
      findLast: { value: this.findLast, enumerable: false },
      get: { value: this.get, enumerable: false },
      oob: { value: this.oob, enumerable: false },
      set: { value: this.set, enumerable: false },
    });
  }
  get rows() {
    return this.#rows;
  }
  get cols() {
    return this.#cols;
  }
  find(predicate: (value: T, index: number, array: Array<T>) => T): Coord | undefined {
    const result = this.array.findIndex(predicate);
    if (result === -1) return undefined;
    return { r: Maths.floor(result / this.#cols), c: result % this.#cols };
  }
  findLast(predicate: (value: T, index: number, array: Array<T>) => T): Coord | undefined {
    const result = this.array.findLastIndex(predicate);
    if (result === -1) return undefined;
    return { r: Maths.floor(result / this.#cols), c: result % this.#cols };
  }
  get(index: Coord): T | undefined {
    return this.array.at(index.r * this.#cols + index.c);
  }
  oob(index: Coord): boolean {
    return index.r < 0 || index.r >= this.#rows || index.c < 0 || index.c >= this.#cols;
  }
  set(index: Coord, value: T): this {
    this.array[index.r * this.#cols + index.c] = value;
    return this;
  }
}

export class TransformedSet<K, T extends number | bigint | string> extends Set<T> {
  #transformer: (value: K) => T;
  #reverter: ((value: T) => K) | undefined;
  constructor(transformer: (value: K) => T, reverter: (value: T) => K, iterable?: Iterable<K>) {
    super(iterable ? Array.from(iterable, transformer) : undefined);
    this.#transformer = transformer;
    this.#reverter = reverter;
  }
  override add(value: K | T): this {
    return super.add(['number', 'bigint', 'string'].includes(typeof value) ? (value as T) : this.#transformer(value as K));
  }
  override delete(value: K | T): boolean {
    return super.delete(['number', 'bigint', 'string'].includes(typeof value) ? (value as T) : this.#transformer(value as K));
  }
  override has(value: K | T): boolean {
    return super.has(['number', 'bigint', 'string'].includes(typeof value) ? (value as T) : this.#transformer(value as K));
  }
  originalValues(): IteratorObject<K, undefined, void> {
    if (this.#reverter === undefined) throw new Error('reverter is not defined');
    return super.values().map((item) => this.#reverter!(item));
  }
  differenceUpdate(iterable: Iterable<K | T>): this {
    for (const value of iterable) this.delete(value);
    return this;
  }
  update(iterable: Iterable<K | T>): this {
    for (const value of iterable) this.add(value);
    return this;
  }
}

export class Counter<T> extends Map<T, number> {
  constructor(iterable?: Iterable<T>) {
    super();
    if (iterable === undefined) return;
    for (const value of iterable) this.add(value, 1);
    return this;
  }
  add(value: T, count: number = 1): this {
    super.set(value, (super.get(value) ?? 0) + count);
    return this;
  }
}
