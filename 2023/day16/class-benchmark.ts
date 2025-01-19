#!/usr/bin/env -S deno --allow-read

const COUNT = 100_000_000;

class SimpleCoord {
  constructor(public r: number, public c: number) {}
}

class Coord {
  constructor(public r: number, public c: number) {}
  add = (value: Coord) => new Coord(this.r + value.r, this.c + value.c);
  sub = (value: Coord) => new Coord(this.r - value.r, this.c - value.c);
  mul = (value: number) => new Coord(this.r * value, this.c * value);
  div = (value: number) => new Coord(Math.floor(this.r / value), Math.floor(this.c / value));
}

class ReducedCoord {
  constructor(public r: number, public c: number) {}
  add = (value: Coord) => new Coord(this.r + value.r, this.c + value.c);
}

interface BasicCoord {
  r: number;
  c: number;
}

const times = new Map<string, number>();

let start = performance.now();
let obj: Coord;
for (let i = 0; i < COUNT; ++i) obj = new Coord(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
let end = performance.now();
times.set('Coord', end - start);

start = performance.now();
let obj2: SimpleCoord;
for (let i = 0; i < COUNT; ++i) obj2 = new SimpleCoord(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
end = performance.now();
times.set('SimpleCoord', end - start);

start = performance.now();
let obj3: BasicCoord;
for (let i = 0; i < COUNT; ++i) obj3 = { r: Math.floor(Math.random() * 1000), c: Math.floor(Math.random() * 1000) };
end = performance.now();
times.set('BasicCoord', end - start);

start = performance.now();
let obj4: ReducedCoord;
for (let i = 0; i < COUNT; ++i) obj4 = new ReducedCoord(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
end = performance.now();
times.set('ReducedCoord', end - start);

console.log(times);
