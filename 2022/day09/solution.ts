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

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

const D4 = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];
const directionMap = new Map<string, number>([
  ['U', 0],
  ['R', 1],
  ['D', 2],
  ['L', 3],
]);
interface Move {
  direction: number;
  distance: number;
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/^([URDL]) (\d+)$/gm)
    .map<Move>((tokens) => ({
      direction: directionMap.get(tokens[1])!,
      distance: Number(tokens[2]),
    }))
    .toArray();

const simulate = (moves: Move[], length: number = 2) => {
  interface Segment {
    r: number;
    c: number;
  }
  const tailVisited = new Set<number>();
  const addTailVisited = (segment: Segment) => tailVisited.add((segment.r << 8) + segment.c);
  const rope = Array.from({ length }, () => ({ r: 0, c: 0 } as Segment));
  addTailVisited(rope[length - 1]);
  for (const move of moves) {
    const [dr, dc] = D4[move.direction];
    for (let moveIx = 1; moveIx <= move.distance; ++moveIx) {
      for (const [segmentIx, segment] of rope.entries()) {
        if (segmentIx === 0) {
          segment.r += dr;
          segment.c += dc;
        } else {
          const ahead = rope[segmentIx - 1];
          if (segment.r >= ahead.r - 1 && segment.r <= ahead.r + 1 && segment.c >= ahead.c - 1 && segment.c <= ahead.c + 1) break;
          if (segment.r != ahead.r) segment.r += ahead.r > segment.r ? 1 : -1;
          if (segment.c != ahead.c) segment.c += ahead.c > segment.c ? 1 : -1;
        }
        if (segmentIx === length - 1) addTailVisited(rope[length - 1]);
      }
    }
  }
  return tailVisited.size;
};

const part1 = () => {
  const result = simulate(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result2 = simulate(parseInput(), 10);
  console.log('part 2:', result2);
};

if (args.part1) part1();
if (args.part2) part2();
