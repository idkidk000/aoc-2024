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
interface Coord {
  r: number;
  c: number;
}
const coordAdd = (left: Coord, right: Coord): Coord => ({ r: left.r + right.r, c: left.c + right.c });
const coordPack = (coord: Coord) => (coord.r << 16) + coord.c;
const coordUnpack = (value: number): Coord => ({ r: value >> 16, c: value & ((1 << 16) - 1) });
const coordEq = (left: Coord, right: Coord) => left.r === right.r && left.c === right.c;
const D4 = new Array<Coord>({ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 });
enum Direction {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}
interface Blizzard extends Coord {
  d: Direction;
}
interface Input {
  grid: Array<Array<string>>;
  rows: number;
  cols: number;
  blizzards: Array<Blizzard>;
  start: Coord;
  end: Coord;
}
interface QueueEntry {
  position: Coord;
  length: number;
}
enum TileContent {
  Wall = '#',
  Empty = '.',
  BlizzardUp = '^',
  BlizzardRight = '>',
  BlizzardDown = 'v',
  BlizzardLeft = '<',
}

const parseInput = (): Input => {
  const grid = Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(''));
  const [rows, cols] = [grid.length, grid[0].length];
  const blizzards = new Array<Blizzard>();
  for (let r = 0; r < rows; ++r) {
    for (let c = 0; c < cols; ++c) {
      const charAt = grid[r][c];
      if ([TileContent.Empty, TileContent.Wall].includes(charAt as TileContent)) continue;
      else if (charAt === TileContent.BlizzardUp) blizzards.push({ r, c, d: Direction.Up });
      else if (charAt === TileContent.BlizzardRight) blizzards.push({ r, c, d: Direction.Right });
      else if (charAt === TileContent.BlizzardDown) blizzards.push({ r, c, d: Direction.Down });
      else if (charAt === TileContent.BlizzardLeft) blizzards.push({ r, c, d: Direction.Left });
      grid[r][c] = TileContent.Empty;
    }
  }
  const start: Coord = { r: 0, c: grid[0].findIndex((value) => value === '.') };
  const end: Coord = { r: rows - 1, c: grid[rows - 1].findIndex((value) => value === '.') };
  return { grid, rows, cols, blizzards, start, end };
};

const simulate = ({ grid, rows, cols, blizzards, start, end }: Input, part2: boolean = false): number => {
  // blizzards move first
  // if a blizzard moves into player position, must move or the path dies
  // shortest path so bfs
  // blizzard state can be shared between all active paths
  // detect when all paths have completed their step and increment the blizzard
  // blizzards can occupy the same tile so can't use their coord as a key for storage
  // store them as an array then convert coords to a set after all blizzard moves
  // might need to use a deque class
  const queue = new Array<QueueEntry>({ position: start, length: 0 });
  const blizzardPositions = new Set<number>();
  const currentPositions = new Set<number>();
  let prevLength = -1;
  while (queue.length > 0) {
    const { position, length } = queue.shift()!;
    if (length > prevLength) {
      //TODO: blizzard things
      for (const blizzard of blizzards) {
        const nextPosition = coordAdd(blizzard, D4[blizzard.d]);
        // i suppose an oob array access exception is an indicator that i've done something wrong
        if (grid[nextPosition.r][nextPosition.c] === TileContent.Wall) {
          if (blizzard.d === Direction.Up) nextPosition.r = rows - 2;
          else if (blizzard.d === Direction.Right) nextPosition.c = 1;
          else if (blizzard.d === Direction.Down) nextPosition.r = 1;
          else if (blizzard.d === Direction.Left) nextPosition.c = cols - 2;
        }
        [blizzard.r, blizzard.c] = [nextPosition.r, nextPosition.c];
      }
      debug(2, { blizzards });
      blizzardPositions.clear();
      for (const packedCoord of blizzards.map((item) => coordPack(item))) blizzardPositions.add(packedCoord);
      prevLength = length;
      debug(1, { qlen: queue.length, positionsLen: currentPositions.size, blizzardsLen: blizzardPositions.size, length });
      currentPositions.clear();
    }
    debug(3, { position, length });
    // prune duplicate states. path lengths are synchronised so it doesn't matter how we arrived at the current position
    const packedPosition = coordPack(position);
    if (currentPositions.has(packedPosition)) continue;
    currentPositions.add(packedPosition);
    // wait here if not occuppied by a blizzard
    if (!blizzardPositions.has(packedPosition)) queue.push({ position, length: length + 1 });
    // usual walk things
    for (const nextPosition of D4.map((offset) => coordAdd(position, offset))) {
      if (
        blizzardPositions.has(coordPack(nextPosition)) ||
        nextPosition.r < 0 ||
        nextPosition.r >= rows ||
        nextPosition.c < 0 ||
        nextPosition.c >= cols ||
        grid[nextPosition.r][nextPosition.c] === TileContent.Wall
      )
        continue;
      if (coordEq(nextPosition, end)) return length + 1;
      queue.push({ position: nextPosition, length: length + 1 });
    }
  }
  throw new Error('bruh');
};

const part1 = () => {
  const input = parseInput();
  debug(4, input);
  const result = simulate(input);
  console.log('part 1:', result);
};

const part2 = () => {
  const result = simulate(parseInput(), true);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
