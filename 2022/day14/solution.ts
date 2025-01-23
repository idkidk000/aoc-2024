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

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

interface Coord {
  x: number;
  y: number;
}
interface Line {
  segments: Array<Coord>;
}
interface Cave {
  occupied: Set<number>;
  maxY: number;
}
const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) =>
      line
        .split(' -> ')
        .map((token) => token.split(','))
        .map<Coord>((tokens) => ({ x: Number(tokens[0]), y: Number(tokens[1]) }))
    )
    .map<Line>((segments) => ({ segments }));

const generateCave = (lines: Line[]): Cave => {
  const occupied = new Set<number>();
  const addOccuppied = (x: number, y: number) => occupied.add((x << 10) + y);
  let maxY = 0;
  for (const line of lines) {
    for (let i = 0; i < line.segments.length - 1; ++i) {
      const [a, b] = [line.segments[i], line.segments[i + 1]];
      for (let x = Maths.min(a.x, b.x); x <= Maths.max(a.x, b.x); ++x) {
        for (let y = Maths.min(a.y, b.y); y <= Maths.max(a.y, b.y); ++y) {
          addOccuppied(x, y);
        }
      }
      maxY = Maths.max(maxY, a.y, b.y);
    }
  }
  return { occupied, maxY };
};

const simulate = (cave: Cave, abyss: boolean = true) => {
  const dropFrom: Coord = { x: 500, y: 0 };
  const isOccupied = (position: Coord) => cave.occupied.has((position.x << 10) + position.y);
  const setOccupied = (position: Coord) => cave.occupied.add((position.x << 10) + position.y);
  for (let objectId = 0; true; ++objectId) {
    const position = { ...dropFrom };
    if (!abyss && isOccupied(position)) return objectId;
    let deflections = 0;
    while (true) {
      if (position.y + 1 > cave.maxY) {
        // part 1 exit
        if (abyss) return objectId;
        // part 2 next particle
        setOccupied(position);
        debug(1, 'ground', { deflections, position });
        break;
      }
      if (!isOccupied({ ...position, y: position.y + 1 })) ++position.y;
      else if (!isOccupied({ x: position.x - 1, y: position.y + 1 })) {
        --position.x;
        ++position.y;
        ++deflections;
      } else if (!isOccupied({ x: position.x + 1, y: position.y + 1 })) {
        ++position.x;
        ++position.y;
        ++deflections;
      } else {
        // no more moves, next particle
        setOccupied(position);
        debug(2, { deflections, position });
        break;
      }
    }
  }
};

const part1 = () => {
  const result = simulate(generateCave(parseInput()));
  console.log('part 1:', result);
  // 737
};

const part2 = () => {
  const cave = generateCave(parseInput());
  const result = simulate({ ...cave, maxY: cave.maxY + 1 }, false);
  console.log('part 2:', result);
  // 28145
};

if (args.part1) part1();
if (args.part2) part2();
