#!/usr/bin/env -S deno --allow-read
import { args, Line, Maths, Maths2, Vec2, Vec2Utils } from '../../.template/_/utils.ts';

const parseInput = (): Array<Line> =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/(\d+),(\d+) -> (\d+),(\d+)/gm)
    .map((tokens) => ({
      a: {
        x: Number(tokens[1]),
        y: Number(tokens[2]),
      },
      b: {
        x: Number(tokens[3]),
        y: Number(tokens[4]),
      },
    }))
    .toArray();

const solve = (lines: Array<Line>, diagonal: boolean = false) => {
  const positions = new Map<number, number>();
  for (const line of lines) {
    if (!diagonal && line.a.x !== line.b.x && line.a.y !== line.b.y) continue;
    const steps = Maths.max(Maths.abs(line.a.x - line.b.x), Maths.abs(line.a.y - line.b.y));
    for (let i = 0; i <= steps; ++i) {
      const x = Maths2.lerp(line.a.x, line.b.x, steps, i);
      const y = Maths2.lerp(line.a.y, line.b.y, steps, i);
      const packed = Vec2Utils.pack({ x, y });
      positions.set(packed, (positions.get(packed) ?? 0) + 1);
    }
  }
  const result = positions
    .values()
    .filter((item) => item > 1)
    .toArray().length;
  return result;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = solve(parseInput(), true);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
