#!/usr/bin/env -S deno --allow-read
import { args, Coord, CoordUtils, Grid, HeapQueue, Maths, TransformedMap } from '../../.template/_/utils.ts';

const parseInput = () => new Grid(Deno.readTextFileSync(args.filename), (value) => Number(value));

const solve = (grid: Grid<number>) => {
  const [start, end] = [grid.find(() => true)!, grid.findLast(() => true)!];
  interface QueueEntry extends Coord {
    cost: number;
  }
  const queue = new HeapQueue<QueueEntry>((a, b) => a.cost - b.cost);
  const tileCosts = new TransformedMap<Coord, number, number>(CoordUtils.pack, CoordUtils.unpack, [[start, 0]]);
  queue.push({ ...start, cost: 0 });
  while (!queue.empty) {
    const current = queue.pop()!;
    if (tileCosts.get(end, Infinity) <= current.cost + 1) continue;
    CoordUtils.offsets
      .map((offset) => CoordUtils.add(current, offset))
      .filter((neighbour) => !grid.oob(neighbour))
      .map((neighbour) => ({ ...neighbour, cost: current.cost + grid.get(neighbour)! }))
      .filter((neighbour) => Maths.min(tileCosts.get(neighbour, Infinity), tileCosts.get(end, Infinity)) > neighbour.cost)
      .forEach((neighbour) => {
        tileCosts.set(neighbour, neighbour.cost);
        if (!CoordUtils.eq(neighbour, end)) queue.push(neighbour);
      });
  }
  return tileCosts.get(end)!;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const grid = parseInput();
  const bigGrid = Grid.create<number>(grid.rows * 5, grid.cols * 5, 0, (_, index) => {
    const value =
      grid.get({ r: index.r % grid.rows, c: index.c % grid.cols })! +
      Maths.floor(index.r / grid.rows) +
      Maths.floor(index.c / grid.cols);
    return value > 9 ? (value + 1) % 10 : value;
  });
  const result = solve(bigGrid);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
