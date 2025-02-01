#!/usr/bin/env -S deno --allow-read
import { args, debug, Coord, CoordUtils, Grid, TransformedSet } from '../../.template/_/utils.ts';

const parseInput = () => new Grid(Deno.readTextFileSync(args.filename), (value) => Number(value));

const simulate = (grid: Grid<number>, iterations: number, hook: (data: { iteration: number; flashes: number }) => boolean) => {
  const flashed = new TransformedSet<Coord, number>(CoordUtils.pack, CoordUtils.unpack);
  for (let iteration = 0; iteration < iterations; ++iteration) {
    for (let i = 0; i < grid.size; ++i) grid.set(i, grid.get(i)! + 1);
    let changed = true;
    while (changed) {
      changed = false;
      for (const position of grid
        .findAll((value) => value > 9)
        .filter((item) => !flashed.has(item))
        .toArray()) {
        debug(2, { position });
        for (const neighbour of CoordUtils.offsets8
          .map((item) => CoordUtils.add(position, item))
          .filter((item) => !grid.oob(item) && grid.get(item)! <= 9)) {
          debug(3, { neighbour });
          grid.set(neighbour, grid.get(neighbour)! + 1);
          changed = true;
        }
        flashed.add(position);
      }
    }
    for (const item of flashed.originalValues()) grid.set(item, 0);
    const flashes = flashed.size;
    debug(1, iteration, flashes, grid.toStringArray());
    if (hook({ iteration, flashes })) return;
    flashed.clear();
  }
};

const part1 = () => {
  let total = 0;
  simulate(parseInput(), 100, ({ flashes }) => {
    total += flashes;
    return false;
  });
  console.log('part 1', total);
};

const part2 = () => {
  const grid = parseInput();
  simulate(grid, Infinity, ({ iteration, flashes }) => {
    if (flashes === grid.size) console.log('part 2:', iteration + 1);
    return flashes === grid.size;
  });
};

if (args.part1) part1();
if (args.part2) part2();
