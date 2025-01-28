#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    pmod(value: number, mod: number): number;
  }
}

Math.pmod = (value: number, mod: number) => {
  const result = value % mod;
  return result >= 0 ? result : result + mod;
};

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

type Instruction = 'R' | 'L' | number;
enum TileContent {
  Void = ' ',
  Empty = '.',
  Wall = '#',
}
interface Props {
  grid: Array<string>;
  rows: number;
  cols: number;
  rowBounds: Array<{ start: number; end: number }>;
  colBounds: Array<{ start: number; end: number }>;
  instructions: Array<Instruction>;
}
interface Coord {
  r: number;
  c: number;
}
enum Direction {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}
const D4 = new Array<Coord>({ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 });
const parseInput = (): Props => {
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');
  const grid = sections[0].split('\n');
  // oh no codium trimmed trailing whitespace from my textfiles
  const rows = grid.length;
  const cols = grid.reduce((acc, item) => Maths.max(acc, item.length), 0);
  for (const [r, row] of grid.entries()) {
    if (row.length < cols) grid[r] = row.padEnd(cols, ' ');
  }
  // find bounds as a preprocessing step so we don't have to loop until not void in the walk loop
  const rowBounds = grid.map((line) => {
    const row = line.split('');
    return {
      start: row.findIndex((value) => value !== TileContent.Void),
      end: row.findLastIndex((value) => value !== TileContent.Void),
    };
  });
  const colBounds = grid[0].split('').map((_, i) => {
    const column = grid.map((line) => line[i]);
    return {
      start: column.findIndex((value) => value !== TileContent.Void),
      end: column.findLastIndex((value) => value !== TileContent.Void),
    };
  });
  const edgeLength =
    rows === (cols / 5) * 2 ? rows / 2 : rows === (cols / 4) * 3 ? rows / 3 : rows === (cols / 3) * 4 ? rows / 4 : rows / 5;
  debug(1, { rows, cols, edgeLength });
  const shape = new Array<Array<1 | 0>>();
  for (let r = 0; r < 5; ++r) {
    if (edgeLength * r >= rows) break;
    const row = new Array<1 | 0>();
    for (let c = 0; c < 5; ++c) {
      if (edgeLength * c >= cols) break;
      row.push(grid[r * edgeLength][c * edgeLength] === TileContent.Void ? 0 : 1);
    }
    shape.push(row);
  }
  debug(1, { shape });
  /*
    https://en.wikipedia.org/wiki/Net_(polyhedron)
    i asked chatgpt to define cubeNets but but she couldn't so i made paper cubes instead
    example is net 7 rotated 90 anticlockwise
    input is net 9
    the remaining nine are left as an exercise for the reader: https://en.wikipedia.org/wiki/Net_(polyhedron)#/media/File:The_11_cubic_nets.svg
  */
  const cubeNets = [
    {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      edges: [
        { from: { r: 0, c: 2, d: 0 }, to: { r: 1, c: 0, d: 0 } },
        { from: { r: 1, c: 0, d: 0 }, to: { r: 0, c: 2, d: 0 } },
        { from: { r: 1, c: 1, d: 0 }, to: { r: 0, c: 2, d: 3 } },
        { from: { r: 0, c: 2, d: 3 }, to: { r: 1, c: 1, d: 0 } },
        { from: { r: 1, c: 0, d: 3 }, to: { r: 3, c: 1, d: 3 } },
        { from: { r: 0, c: 2, d: 1 }, to: { r: 3, c: 2, d: 2 } },
        { from: { r: 1, c: 2, d: 1 }, to: { r: 3, c: 2, d: 1 } },
        { from: { r: 1, c: 0, d: 2 }, to: { r: 2, c: 1, d: 3 } },
        { from: { r: 1, c: 2, d: 2 }, to: { r: 2, c: 1, d: 1 } },
        { from: { r: 2, c: 1, d: 3 }, to: { r: 1, c: 0, d: 2 } },
        { from: { r: 2, c: 1, d: 1 }, to: { r: 1, c: 2, d: 2 } },
        { from: { r: 3, c: 1, d: 3 }, to: { r: 1, c: 0, d: 3 } },
        { from: { r: 3, c: 1, d: 2 }, to: { r: 0, c: 2, d: 1 } },
        { from: { r: 3, c: 1, d: 1 }, to: { r: 1, c: 2, d: 1 } },
      ],
    },
    {
      shape: [
        [0, 1, 1],
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
      edges: [
        { from: { r: 0, c: 1, d: 0 }, to: { r: 3, c: 0, d: 3 } },
        { from: { r: 0, c: 1, d: 3 }, to: { r: 2, c: 0, d: 3 } },
        { from: { r: 0, c: 2, d: 0 }, to: { r: 3, c: 0, d: 2 } },
        { from: { r: 0, c: 2, d: 1 }, to: { r: 2, c: 1, d: 2 } },
        { from: { r: 0, c: 2, d: 2 }, to: { r: 1, c: 1, d: 3 } },
        { from: { r: 1, c: 1, d: 1 }, to: { r: 2, c: 0, d: 0 } },
        { from: { r: 1, c: 1, d: 3 }, to: { r: 0, c: 2, d: 2 } },
        { from: { r: 2, c: 0, d: 0 }, to: { r: 1, c: 1, d: 3 } },
        { from: { r: 2, c: 0, d: 3 }, to: { r: 0, c: 1, d: 3 } },
        { from: { r: 2, c: 1, d: 1 }, to: { r: 0, c: 2, d: 3 } },
        { from: { r: 2, c: 1, d: 2 }, to: { r: 3, c: 0, d: 1 } },
        { from: { r: 3, c: 0, d: 1 }, to: { r: 2, c: 1, d: 2 } },
        { from: { r: 3, c: 0, d: 2 }, to: { r: 0, c: 2, d: 0 } },
        { from: { r: 3, c: 0, d: 3 }, to: { r: 2, c: 1, d: 2 } },
      ],
    },
  ];
  // now need to test four rotations and a reflection of each of shape and see if it matches one in cubeNets

  const instructions = sections[1]
    .matchAll(/(R|L|\d+)/g)
    .map<Instruction>((token) => (['R', 'L'].includes(token[1]) ? (token[1] as Instruction) : Number(token[1])))
    .toArray();
  return { grid, rows, cols, rowBounds, colBounds, instructions };
};

const solve = ({ grid, instructions, rowBounds, colBounds }: Props, cubeTime = false) => {
  const addCoord = (left: Coord, right: Coord): Coord => ({ r: left.r + right.r, c: left.c + right.c });
  let position: Coord = { c: grid[0].indexOf(TileContent.Empty), r: 0 };
  let direction = Direction.Right;
  debug(1, 'start', { position, direction });
  for (const instruction of instructions) {
    if (typeof instruction === 'number') {
      const offset = D4[direction];
      for (let i = 0; i < instruction; ++i) {
        const nextPosition = addCoord(position, offset);
        debug(3, { position, offset, i, nextPosition });

        // TODO: cubeTime will need edgeMappings which i haven't written yet
        if (!cubeTime) {
          // wrap to bounds
          if ([Direction.Up, Direction.Down].includes(direction)) {
            const bounds = colBounds[nextPosition.c];
            if (nextPosition.r < bounds.start) nextPosition.r = bounds.end;
            else if (nextPosition.r > bounds.end) nextPosition.r = bounds.start;
          } else {
            const bounds = rowBounds[nextPosition.r];
            if (nextPosition.c < bounds.start) nextPosition.c = bounds.end;
            else if (nextPosition.c > bounds.end) nextPosition.c = bounds.start;
          }
        }

        // test charAt and move or break
        const charAt = grid[nextPosition.r][nextPosition.c];
        if (charAt === TileContent.Empty) position = nextPosition;
        else if (charAt === TileContent.Wall) break;
        else throw new Error(`no ${JSON.stringify(position)} ${JSON.stringify(nextPosition)} "${charAt}"`);
      }
    } else if (instruction === 'L') direction = Maths.pmod(direction - 1, 4);
    else if (instruction === 'R') direction = (direction + 1) % 4;
    debug(1, { instruction, position, direction });
  }
  const result = (position.r + 1) * 1000 + (position.c + 1) * 4 + Maths.pmod(direction - 1, 4);
  return result;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);

  // 133174
};

const part2 = () => {
  //ugh
  // coordinates are still relative to the input
  // oob also changes direction
  // might be able to bodge it without refactoring as a cube walker
  // const result = solve(parseInput(), true);
  // console.log('part 2:', result);
  parseInput();
};

if (args.part1) part1();
if (args.part2) part2();
