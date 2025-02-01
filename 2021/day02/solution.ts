#!/usr/bin/env -S deno --allow-read
import { args } from '../../.template/_/utils.ts';

type Direction = 'forward' | 'up' | 'down';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/))
    .map((tokens) => ({
      direction: tokens[0] as Direction,
      value: Number(tokens[1]),
    }));

const part1 = () => {
  const position = parseInput().reduce(
    (acc, { direction, value }) => {
      direction === 'up' ? (acc.y -= value) : direction === 'down' ? (acc.y += value) : (acc.x += value);
      return acc;
    },
    { x: 0, y: 0 }
  );
  const result = position.x * position.y;
  console.log('part 1:', result);
};

const part2 = () => {
  const position = parseInput().reduce(
    (acc, { direction, value }) => {
      direction === 'up'
        ? (acc.a -= value)
        : direction === 'down'
        ? (acc.a += value)
        : ((acc.x += value), (acc.y += acc.a * value));
      return acc;
    },
    { x: 0, y: 0, a: 0 }
  );
  const result = position.x * position.y;
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
