// #region args
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
// #endregion

// #region Maths
export const Maths = Math;

// deno-lint-ignore no-namespace
export namespace MathsUtils {
  export function clamp(value: number, min: number, max: number): number {
    return Maths.max(Maths.min(value, max), min);
  }
  export function factorial(value: number): number | undefined {
    return value < 0 ? undefined : value === 0 ? 1 : value * factorial(value - 1)!;
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
    { a: { x: x0, y: y0 }, b: { x: x1, y: y1 } }: Line,
    { a: { x: x2, y: y2 }, b: { x: x3, y: y3 } }: Line,
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
// #endregion

// #region coord
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
  export const offsets8 = new Array<Coord>(
    { r: -1, c: 0 },
    { r: -1, c: 1 },
    { r: 0, c: 1 },
    { r: 1, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: -1 },
    { r: 0, c: -1 },
    { r: -1, c: -1 }
  );
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
// #endregion

// #region vec2
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
// #endregion

// #region vec3
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
// #endregion

// #region queues
export class Deque<T> {
  private queue: Array<T>;
  #front: number = 0;
  #back: number = 0;
  #length: number = 1000;
  constructor(length?: number) {
    if (length !== undefined) this.#length = length;
    this.queue = new Array<T>(this.#length);
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
      if (this.#front == this.#back) this.#grow();
    }
    return this;
  }
  pushFront(...values: Array<T>): this {
    for (const value of values.toReversed()) {
      this.#front = (this.#front - 1 + this.#length) % this.#length;
      if (this.#front == this.#back) this.#grow();
      this.queue[this.#front] = value;
    }
    return this;
  }
  #grow(): void {
    const growBy = this.#length;
    const queue = new Array<T>(this.#length + growBy);
    for (let i = 0; i < this.#back; ++i) queue[i] = this.queue[i];
    for (let i = this.#front; i < this.#length; ++i) queue[i + growBy] = this.queue[i];
    this.queue = queue;
    this.#front += growBy;
    this.#length += growBy;
  }
}

export class HeapQueue<T> {
  private queue = new Array<T>();
  #comparator: (a: T, b: T) => number;
  constructor(comparator: (a: T, b: T) => number) {
    this.#comparator = comparator;
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
// #endregion

export class Grid<T extends string | number | boolean> {
  readonly rows: number;
  readonly cols: number;
  private array: Array<T>;
  constructor(data: string, transformer?: (value: string, index: Coord) => T);
  constructor(data: Array<Array<T>>, transformer?: (value: T, index: Coord) => T);
  constructor(data: string | Array<Array<T>>, transformer?: (value: string | T, index: Coord) => T) {
    if (typeof data === 'string') {
      if (transformer === undefined && typeof ('' as T) !== 'string') throw new Error('transformer required for this type');
      const rows = data.split('\n').filter((line) => line.length > 0);
      [this.rows, this.cols] = [rows.length, rows[0].length];
      this.array = rows
        .join('')
        .split('')
        .map((value, i) => (transformer !== undefined ? transformer(value, this.#indexToCoord(i)) : value)) as Array<T>;
    } else {
      [this.rows, this.cols] = [data.length, data[0].length];
      this.array = data
        .flat(1)
        .map((value, i) => (transformer !== undefined ? transformer(value, this.#indexToCoord(i)) : value));
    }
  }
  static create<T extends string | number | boolean>(
    rows: number,
    cols: number,
    fill: T,
    transformer?: (value: T, index: Coord) => T
  ): Grid<T> {
    return new Grid<T>(
      Array.from({ length: rows }, () => new Array(cols).fill(fill)),
      transformer
    );
  }
  get length() {
    return this.rows * this.cols;
  }
  find(predicate: (value: T, index: Coord) => boolean): Coord | undefined {
    const result = this.array.findIndex((item, i) => predicate(item, this.#indexToCoord(i)));
    return result === -1 ? undefined : this.#indexToCoord(result);
  }
  findLast(predicate: (value: T, index: Coord) => boolean): Coord | undefined {
    const result = this.array.findLastIndex((item, i) => predicate(item, this.#indexToCoord(i)));
    return result === -1 ? undefined : this.#indexToCoord(result);
  }
  *findAll(predicate: (value: T, index: Coord) => boolean): Generator<Coord, void, void> {
    for (let i = 0; i < this.length; ++i) {
      if (predicate(this.array[i], this.#indexToCoord(i))) yield this.#indexToCoord(i);
    }
  }
  forEach(callbackfn: (index: Coord, value: T) => void): void {
    for (let i = 0; i < this.length; ++i) callbackfn(this.#indexToCoord(i), this.array[i]);
  }
  get(index: Coord | number): T | undefined {
    return this.array.at(typeof index === 'number' ? index : this.#coordToIndex(index));
  }
  oob(index: Coord): boolean {
    return index.r < 0 || index.r >= this.rows || index.c < 0 || index.c >= this.cols;
  }
  set(index: Coord | number, value: T | ((prevValue: T) => T)): this {
    const arrayIndex = typeof index === 'number' ? index : this.#coordToIndex(index);
    this.array[arrayIndex] = value instanceof Function ? value(this.array[arrayIndex]) : value;
    return this;
  }
  keys(): ArrayIterator<Coord> {
    return this.array.keys().map((index) => this.#indexToCoord(index));
  }
  values(): ArrayIterator<T> {
    return this.array.values();
  }
  entries(): IteratorObject<[Coord, T]> {
    return this.array.entries().map(([index, value]) => [this.#indexToCoord(index), value]);
  }
  [Symbol.iterator]() {
    return this.keys();
  }
  toStringArray(): Array<string> {
    const result = new Array<string>();
    for (let r = 0; r < this.rows; ++r) {
      result.push(this.array.slice(r * this.cols, (r + 1) * this.cols).join(''));
    }
    return result;
  }
  #indexToCoord(index: number): Coord {
    return { r: Maths.floor(index / this.cols), c: index % this.cols };
  }
  #coordToIndex(index: Coord): number {
    return index.r * this.cols + index.c;
  }
}

export class TransformedSet<K extends object, T extends number | bigint | string> extends Set<T> {
  #transformer: (value: K) => T;
  #reverter: ((value: T) => K) | undefined;
  constructor(transformer: (value: K) => T, reverter?: (value: T) => K, iterable?: Iterable<K>) {
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

export class TransformedMap<K extends object, T extends number | bigint | string, V> extends Map<T, V> {
  #transformer: (value: K) => T;
  #reverter: ((value: T) => K) | undefined;
  constructor(transformer: (value: K) => T, reverter?: (value: T) => K, iterable?: Iterable<[K, V]>) {
    super(iterable ? Array.from(iterable, ([k, v]) => [transformer(k), v]) : undefined);
    this.#transformer = transformer;
    this.#reverter = reverter;
  }
  override set(key: K | T, value: V | ((prevValue: V | undefined) => V)): this {
    const mapKey = ['number', 'bigint', 'string'].includes(typeof key) ? (key as T) : this.#transformer(key as K);
    return super.set(mapKey, value instanceof Function ? value(super.get(mapKey)) : value);
  }
  override get(key: K | T): V | undefined;
  override get(key: K | T, fallback: V): V;
  override get(key: K | T, fallback?: V): V | undefined {
    return super.get(['number', 'bigint', 'string'].includes(typeof key) ? (key as T) : this.#transformer(key as K)) ?? fallback;
  }
  override has(key: K | T): boolean {
    return super.has(['number', 'bigint', 'string'].includes(typeof key) ? (key as T) : this.#transformer(key as K));
  }
  override delete(key: K | T): boolean {
    return super.delete(['number', 'bigint', 'string'].includes(typeof key) ? (key as T) : this.#transformer(key as K));
  }
  originalKeys(): IteratorObject<K, undefined, void> {
    if (this.#reverter === undefined) throw new Error('reverter is not defined');
    return super.keys().map((item) => this.#reverter!(item));
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
  override get(key: T): number {
    return super.get(key) ?? 0;
  }
}

// deno-lint-ignore no-namespace
export namespace IterUtils {
  export function permutations<T>(values: Array<T>): Array<Array<T>> {
    if (values.length === 0) return new Array<Array<T>>(new Array<T>());
    return values.flatMap((value, i) =>
      permutations([...values.slice(0, i), ...values.slice(i + 1)]).map((perm) => [value, ...perm])
    );
  }
}

//TODO: console colour functions. base colours, bright bool, invert bool. rgb with invert bool
