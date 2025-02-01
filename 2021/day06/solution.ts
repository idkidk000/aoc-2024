#!/usr/bin/env -S deno --allow-read
import { args, debug } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/\d+/g)
    .map((token) => Number(token))
    .toArray();

const solve = (input: Array<number>, iterations: number = 80) => {
  const counter = new Map<number, number>();
  const updateCounter = (key: number, count: number) => counter.set(key, (counter.get(key) ?? 0) + count);
  for (const key of input) updateCounter(key, 1);
  for (let i = 0; i < iterations; ++i) {
    for (const [key, count] of counter.entries().toArray()) {
      updateCounter(key, -count);
      if (key === 0) {
        updateCounter(6, count);
        updateCounter(8, count);
      } else updateCounter(key - 1, count);
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
