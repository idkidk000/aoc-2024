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
  r: number;
  c: number;
}
interface Elf {
  position: Coord;
  nextPosition: Coord | undefined;
}
enum Direction {
  North = 0,
  South = 1,
  West = 2,
  East = 3,
}
const directionOffsets = new Map<Direction, Array<Coord>>([
  [Direction.North, new Array<Coord>({ r: -1, c: 0 }, { r: -1, c: -1 }, { r: -1, c: 1 })],
  [Direction.South, new Array<Coord>({ r: 1, c: 0 }, { r: 1, c: -1 }, { r: 1, c: 1 })],
  [Direction.West, new Array<Coord>({ r: 0, c: -1 }, { r: -1, c: -1 }, { r: 1, c: -1 })],
  [Direction.East, new Array<Coord>({ r: 0, c: 1 }, { r: -1, c: 1 }, { r: 1, c: 1 })],
]);
const coordAdd = (left: Coord, right: Coord): Coord => ({ r: left.r + right.r, c: left.c + right.c });
const coordPack = (coord: Coord) => (coord.r << 16) + coord.c;
enum Move {
  Proposed = 1,
  Duplicate = 2,
}

const parseInput = () => {
  const grid = Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim);
  const [rows, cols] = [grid.length, grid[0].length];
  const elves = new Array<Elf>();
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      if (grid[r][c] === '#')
        elves.push({
          position: { r, c },
          nextPosition: undefined,
        });
    }
  }
  return elves;
};

const simulate = (elves: Array<Elf>, maxRounds: number) => {
  let moved = true;
  const elvesMap = new Map<number, Elf>(elves.map((item) => [coordPack(item.position), item]));
  const nextPositions = new Map<number, Move>();
  const render = (label: string) => {
    if (args.debug) {
      const [minR, maxR, minC, maxC] = elvesMap
        .values()
        .reduce(
          (acc, item) => [
            Maths.min(acc[0], item.position.r),
            Maths.max(acc[1], item.position.r),
            Maths.min(acc[2], item.position.c),
            Maths.max(acc[3], item.position.c),
          ],
          [Infinity, -Infinity, Infinity, -Infinity]
        );
      const grid: Array<Array<string>> = Array.from({ length: maxR - minR + 1 }, () => new Array(maxC - minC + 1).fill('.'));
      for (const elf of elvesMap.values()) grid[elf.position.r - minR][elf.position.c - minC] = '\x1b[32m#\x1b[0m';
      const emptyTiles = (maxR - minR + 1) * (maxC - minC + 1) - elves.values().toArray().length;
      debug(1, label, { minR, maxR, minC, maxC, emptyTiles });
      for (const [r, row] of grid.entries()) debug(1, `${(r + minR).toString().padStart(3, ' ')}: ${row.join('')}`);
    }
  };
  render('initial');
  let round;
  for (round = 0; round < maxRounds && moved; ++round) {
    moved = false;
    nextPositions.clear();
    for (const elf of elvesMap.values()) {
      elf.nextPosition = undefined;
      // find neighbours
      if (
        directionOffsets
          .values()
          .toArray()
          .flat()
          .map((offset) => coordAdd(elf.position, offset))
          .some((position) => elvesMap.has(coordPack(position)))
      ) {
        // set next positions
        for (let direction = round % 4; direction < (round % 4) + 4; ++direction) {
          if (
            !directionOffsets
              .get(direction % 4)!
              .map((offset) => coordAdd(elf.position, offset))
              .some((position) => elvesMap.has(coordPack(position)))
          ) {
            // cardinals are first in the array
            const nextPosition = coordAdd(elf.position, directionOffsets.get(direction % 4)![0]);
            const packedNextPosition = coordPack(nextPosition);
            if (nextPositions.has(packedNextPosition)) {
              nextPositions.set(packedNextPosition, Move.Duplicate);
              debug(2, 'duplicate', elf.position, '->', nextPosition, { direction });
            } else {
              elf.nextPosition = nextPosition;
              nextPositions.set(packedNextPosition, Move.Proposed);
              debug(2, 'propose', elf.position, '->', elf.nextPosition, { direction });
            }
            break;
          }
        }
      } else debug(2, 'stay', elf.position);
    }
    // update
    elvesMap
      .entries()
      .filter(
        ([_, elf]) => typeof elf.nextPosition !== 'undefined' && nextPositions.get(coordPack(elf.nextPosition)) === Move.Proposed
      )
      .toArray() // render to array so i can update the underlying map
      .forEach(([prevPackedPosition, elf]) => {
        elf.position = elf.nextPosition!;
        elvesMap.delete(prevPackedPosition);
        elvesMap.set(coordPack(elf.nextPosition!), elf);
        moved = true;
      });
    render(`round ${round + 1}`);
  }
  const [minR, maxR, minC, maxC] = elvesMap
    .values()
    .reduce(
      (acc, item) => [
        Maths.min(acc[0], item.position.r),
        Maths.max(acc[1], item.position.r),
        Maths.min(acc[2], item.position.c),
        Maths.max(acc[3], item.position.c),
      ],
      [Infinity, -Infinity, Infinity, -Infinity]
    );

  const emptyTiles = (maxR - minR + 1) * (maxC - minC + 1) - elvesMap.values().toArray().length;
  return { emptyTiles, round };
};

const part1 = () => {
  const { emptyTiles: result } = simulate(parseInput(), 10);
  console.log('part 1:', result);

  // 4208
};

const part2 = () => {
  const { round: result } = simulate(parseInput(), Infinity);
  console.log('part 2:', result);

  // 1016
};

if (args.part1) part1();
if (args.part2) part2();
