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
// #region interfaces etc
interface Coord {
  r: number;
  c: number;
}
// deno-lint-ignore no-namespace
namespace CoordUtils {
  const colBits = 4; // -1 to 8
  const colAdd = 1;
  const colMask = (1 << colBits) - 1;
  export const pack = (value: Coord) => (value.r << colBits) + value.c + colAdd;
  export const unpack = (value: number): Coord => ({ r: value >> colBits, c: (value & colMask) - colAdd });
  export const add = (...values: Array<Coord>): Coord =>
    values.reduce((acc, item) => ({ r: acc.r + item.r, c: acc.c + item.c }), { r: 0, c: 0 });
  export const eq = (left: Coord, right: Coord) => left.r === right.r && left.c === right.c;
}
class CoordSet extends Set<number> {
  constructor(iterable?: Iterable<Coord>) {
    super(iterable ? Array.from(iterable, CoordUtils.pack) : undefined);
  }
  override add(value: Coord | number) {
    return super.add(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  override has(value: Coord | number) {
    return super.has(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  override delete(value: Coord | number) {
    return super.delete(typeof value === 'number' ? value : CoordUtils.pack(value));
  }
  // the missing methods
  update(iterable: Iterable<Coord | number>) {
    for (const value of iterable) this.add(value);
  }
  differenceUpdate(iterable: Iterable<Coord | number>) {
    for (const value of iterable) this.delete(value);
  }
  //overriding .values() seems troublesome so lets do this instead
  coordValues() {
    return super.values().map((item) => CoordUtils.unpack(item));
  }
}
enum RockContent {
  Rock = '#',
  Empty = '.',
}
interface Input {
  jets: Array<Coord>;
  rocks: Array<Array<Coord>>;
}
// #endregion

const parseInput = (): Input => {
  const jets = Deno.readTextFileSync(args.filename)
    .split('\n')[0]
    .split('')
    .map<Coord>((token) => ({ r: 0, c: token === '<' ? -1 : 1 }));
  const rawRocks = Deno.readTextFileSync('rocks.txt')
    .split('\n\n')
    .map((section) => section.split('\n').filter((line) => line.trim()));
  const rocks = new Array<Array<Coord>>();
  for (const rawRock of rawRocks) {
    const [h, w] = [rawRock.length, rawRock[0].length];
    const rock = new Array<Coord>();
    for (let r = 0; r < h; ++r) {
      for (let c = 0; c < w; ++c) {
        if (rawRock[r][c] === RockContent.Rock) rock.push({ r: h - r - 1, c });
      }
    }
    rocks.push(rock);
  }
  debug(4, { rocks });
  return { jets, rocks };
};

const simulate = ({ jets, rocks }: Input, iterations: number) => {
  const width = 7;
  const spawnOffset: Coord = { r: 3, c: 2 };
  const lockedCoords = new CoordSet(new Array<number>(width).fill(0).map((_, c) => ({ r: -1, c })));
  const cache = new Map<bigint, { iteration: number; maxHeight: number }>();

  let cycleRowOffset = 0;
  let jetIndex = 0;
  let maxHeight = 0;

  for (let iteration = 0; iteration < iterations; ++iteration) {
    // prune lockedCoords periodically to help performance
    if (iteration > 0 && iteration % 100 === 0) {
      // magic number :| maybe lower will also work but i don't think the maximum hole height can be determined ahead of time
      lockedCoords.differenceUpdate(lockedCoords.coordValues().filter((item) => item.r < maxHeight - 50));
    }
    // create rockCoords set from the next rock offset by spawn offset+maxHeight
    let rockCoords = new CoordSet(
      rocks[iteration % rocks.length].map((item) => CoordUtils.add(item, spawnOffset, { r: maxHeight, c: 0 }))
    );
    // debugs are all gated since array casting is quite expensive
    if (args.debug >= 3) debug(3, 'spawn', { maxHeight }, rockCoords.coordValues().toArray());
    let moved = true;
    while (moved) {
      moved = false;
      const jet = jets[jetIndex % jets.length];
      // create a set of rock coords offset by jet
      const rockCoordsJet = new CoordSet(rockCoords.coordValues().map((item) => CoordUtils.add(item, jet)));
      // update rock if in bounds and no intersection with lockedCoords
      // use !some so we bail early on oob and smaller.isDisjointFrom(larger) so only the rockCoordsJet set is iterated over
      if (
        !rockCoordsJet.coordValues().some((item) => item.c < 0 || item.c >= width) &&
        rockCoordsJet.isDisjointFrom(lockedCoords)
      )
        rockCoords = rockCoordsJet;
      if (args.debug >= 4) debug(4, 'after jet', { jet }, rockCoords.coordValues().toArray());
      // create a set of rock coords offset by drop
      const rockCoordsDrop = new CoordSet(rockCoords.coordValues().map((item) => CoordUtils.add(item, { r: -1, c: 0 })));
      // update rock and set moved flag if in bounds and no intersection with lockedCoords
      if (
        !rockCoordsDrop.coordValues().some((item) => item.c < 0 || item.c >= width) &&
        rockCoordsDrop.isDisjointFrom(lockedCoords)
      ) {
        rockCoords = rockCoordsDrop;
        moved = true;
        if (args.debug >= 4) debug(4, 'after drop', rockCoords.coordValues().toArray());
        // only increment on move. we'll update it for non-move separately after finalisation
        ++jetIndex;
      }
    }
    // move loop has completed
    if (args.debug >= 2) debug(2, 'locked', { iteration, jetIndex, maxHeight, rockCoords: rockCoords.coordValues().toArray() });
    // push packed rockCoords to lockedCoords
    lockedCoords.update(rockCoords);
    maxHeight = lockedCoords.coordValues().reduce((acc, item) => Maths.max(acc, item.r), -1) + 1;
    //the important bit. col height differences. this is why i couldn't get my original solution to work for p2
    const colHeights = lockedCoords
      .coordValues()
      .reduce((acc, item) => {
        acc[item.c] = Maths.max(acc[item.c], item.r);
        return acc;
      }, new Array(width).fill(0))
      .map((item) => maxHeight - item);
    // this is barely faster than two BigInt()s per reduce() call
    const cacheKey =
      (BigInt((iteration % rocks.length << 25) | (jetIndex % jets.length << 12) | (colHeights[0] << 6) | colHeights[1]) << 30n) |
      BigInt((colHeights[2] << 24) | (colHeights[3] << 18) | (colHeights[4] << 12) | (colHeights[5] << 6) | (colHeights[6] << 0));
    if (cache.has(cacheKey)) {
      // found the loop. add as much as possible to cycleRowOffset and iteration then simulate the remainder
      const { iteration: prevIteration, maxHeight: prevMaxHeight } = cache.get(cacheKey)!;
      const iterationsRemaining = iterations - iteration;
      const cycleLength = iteration - prevIteration;
      const multiplier = Maths.floor(iterationsRemaining / cycleLength);
      cycleRowOffset = multiplier * (maxHeight - prevMaxHeight);
      debug(1, 'found cycle', { cacheKey, iteration, prevIteration, maxHeight, prevMaxHeight, multiplier, cycleRowOffset });
      iteration += multiplier * cycleLength;
      // everything from here is in the cache already which will break things
      cache.clear();
    } else cache.set(cacheKey, { iteration, maxHeight });
    // don't incremeent until we've finalised the move and cache
    ++jetIndex;
  }
  const result = cycleRowOffset + lockedCoords.coordValues().reduce((acc, item) => Maths.max(acc, item.r), -Infinity) + 1;
  debug(1, { iterations, result });
  return result;
};

const part1 = () => {
  const result = simulate(parseInput(), 2022);
  console.log('part 1:', result);
};

const part2 = () => {
  const result = simulate(parseInput(), 1_000_000_000_000);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
if (!(args.part1 || args.part2)) simulate(parseInput(), 10);
