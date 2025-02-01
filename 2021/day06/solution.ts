#!/usr/bin/env -S deno --allow-read
import { args, debug, Counter } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/\d+/g)
    .map((token) => Number(token))
    .toArray();

const solve = (input: Array<number>, iterations: number = 80) => {
  const counter = new Counter<number>(input);
  for (let i = 0; i < iterations; ++i) {
    for (const [key, count] of counter.entries().toArray()) {
      counter.add(key, -count);
      if (key === 0) {
        counter.add(6, count);
        counter.add(8, count);
      } else counter.add(key - 1, count);
    }
    debug(1, { i, counter });
  }
  return counter.values().reduce((acc, item) => acc + item, 0);
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(parseInput(), 256);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
