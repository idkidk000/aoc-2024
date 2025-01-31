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

const Maths = Math;

// deno-lint-ignore no-namespace
namespace Maths2 {
  export function lerp(left: number, right: number, steps: number, step: number) {
    return left + ((right - left) / steps) * step;
  }
}

interface Vec2 {
  x: number;
  y: number;
}

// deno-lint-ignore no-namespace
namespace Vec2Utils {
  const width = 16;
  const offset = 0;
  export function pack(value: Vec2): number {
    return ((value.x + offset) << width) | (value.y + offset);
  }
}

const args = new Args();
// #endregion

interface Line {
  a: Vec2;
  b: Vec2;
}

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
