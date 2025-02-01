#!/usr/bin/env -S deno --allow-read
import {
  args,
  debug,
  Coord,
  CoordC,
  CoordUtils,
  Counter,
  Deque,
  Grid,
  HeapQueue,
  Line,
  Maths,
  Maths2,
  TransformedSet,
  Vec2,
  Vec2C,
  Vec2Utils,
  Vec3,
  Vec3C,
  Vec3Utils,
} from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim());

const solve = () => {};

const part1 = () => {};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
