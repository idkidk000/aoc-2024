#!/usr/bin/env -S deno --allow-read
import { args } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((token) => Number(token));

const part1 = () => {
  const result = parseInput().reduce((acc, item, i, arr) => acc + (i > 0 && item > arr[i - 1] ? 1 : 0), 0);
  console.log('part 1:', result);
};

const part2 = () => {
  const result = parseInput()
    .map((item, i, arr) => (i > 1 ? item + arr[i - 1] + arr[i - 2] : undefined))
    .filter((item) => item !== undefined)
    .reduce((acc, item, i, arr) => acc + (i > 0 && item > arr[i - 1] ? 1 : 0), 0);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
