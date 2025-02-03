#!/usr/bin/env -S deno --allow-read
import { args, debug, Coord, CoordUtils, Deque, Grid, TransformedSet } from '../../.template/_/utils.ts';

const parseInput = () => new Grid(Deno.readTextFileSync(args.filename), (value) => Number(value));

const findLowPoints = (grid: Grid<number>, hook: (data: { r: number; c: number; value: number }) => void) => {
  grid
    .findAll((value, index) =>
      CoordUtils.offsets
        .map((offset) => CoordUtils.add(index, offset))
        .filter((neighbour) => !grid.oob(neighbour))
        .every((neighbour) => grid.get(neighbour)! > value)
    )
    .forEach((index) => hook({ ...index, value: grid.get(index)! }));
};

const part1 = () => {
  let result = 0;
  findLowPoints(parseInput(), ({ value }) => (result += value + 1));
  console.log('part 1:', result);
};

const part2 = () => {
  const grid = parseInput();
  const lowPoints = new Array<Coord>();
  findLowPoints(grid, ({ r, c }) => lowPoints.push({ r, c }));

  // loop over and region walk
  const queue = new Deque<Coord>();
  const walked = new TransformedSet<Coord, number>(CoordUtils.pack, CoordUtils.unpack);
  const region = new TransformedSet<Coord, number>(CoordUtils.pack, CoordUtils.unpack);
  const regionSizes = new Array<number>();

  for (const lowPoint of lowPoints) {
    queue.push(lowPoint);
    while (!queue.empty) {
      const position = queue.popFront()!;
      CoordUtils.offsets
        .map((item) => CoordUtils.add(position, item))
        .filter((item) => !grid.oob(item) && !region.has(item) && !walked.has(item) && grid.get(item)! < 9)
        .forEach((item) => {
          region.add(item);
          queue.push(item);
        });
    }
    // push region to walked set and size to array. clear region for next iteration
    debug(1, region.originalValues(), region.size);
    regionSizes.push(region.size);
    walked.update(region);
    region.clear();
  }

  const result = regionSizes
    .toSorted((a, b) => b - a)
    .slice(0, 3)
    .reduce((acc, item) => acc * item);

  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
