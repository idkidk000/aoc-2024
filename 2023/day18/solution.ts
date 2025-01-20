#!/usr/bin/env -S deno --allow-read
// #region base aoc template
const Maths = Math;

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

class Coord {
  constructor(public r: number, public c: number) {}
  add = (value: Coord) => new Coord(this.r + value.r, this.c + value.c);
  mul = (value: number) => new Coord(this.r * value, this.c * value);
}

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

interface Move {
  direction: number;
  distance: number;
}

const dirLabelToId = new Map<string, number>([
  ['U', 0],
  ['R', 1],
  ['D', 2],
  ['L', 3],
]);

const dirIdToOffset = new Map<number, Coord>([
  [0, new Coord(-1, 0)],
  [1, new Coord(0, 1)],
  [2, new Coord(1, 0)],
  [3, new Coord(0, -1)],
]);

const solve = (moves: Move[]) => {
  const coords = [new Coord(0, 0)];
  let perimeter = 0;
  for (const move of moves) {
    perimeter += move.distance;
    coords.push(coords.slice(-1)[0].add(dirIdToOffset.get(move.direction)!.mul(move.distance)));
  }
  // shoelace
  const area = Maths.abs(
    coords.reduce((acc, c0, i) => {
      const c1 = coords[(i + 1) % coords.length];
      return acc + c0.r * c1.c - c0.c * c1.r;
    }, 0) / 2
  );
  // picks
  const internalArea = area - perimeter / 2 + 1;

  return perimeter + internalArea;
};

const part1 = () => {
  const moves: Move[] = input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const tokens = line.split(/\s+/);
      return { direction: dirLabelToId.get(tokens[0])!, distance: Number(tokens[1]) };
    });
  const result = solve(moves);
  console.log('part 1:', result);
};

const part2 = () => {
  //R 6 (#70c710)
  const regex = /[URDL] \d+ \(#([\da-f]{5})(\d)\)/;
  const moves: Move[] = input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [_, distanceHex, direction] = regex.exec(line)!;
      return { direction: (Number(direction) + 1) % 4, distance: parseInt(distanceHex, 16) };
    });
  const result = solve(moves);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
