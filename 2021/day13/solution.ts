#!/usr/bin/env -S deno --allow-read
import { args, debug, Maths, TransformedSet, Vec2, Vec2Utils } from '../../.template/_/utils.ts';

interface Input {
  dots: Array<Vec2>;
  folds: Array<{ axis: 'x' | 'y'; value: number }>;
}

const parseInput = (): Input => {
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');
  const dots = sections[0]
    .matchAll(/(\d+),(\d+)/gm)
    .map(([_, x, y]) => ({
      x: Number(x),
      y: Number(y),
    }))
    .toArray();
  const folds = sections[1]
    .matchAll(/fold along ([xy])=(\d+)/gm)
    .map(([_, axis, value]) => ({
      axis,
      value: Number(value),
    }))
    .toArray();
  return { dots, folds } as Input;
};

const solve = ({ dots, folds }: Input, first: boolean = true) => {
  const paper = new TransformedSet<Vec2, number>(Vec2Utils.pack, Vec2Utils.unpack, dots);
  for (const fold of folds) {
    paper
      .originalValues()
      .filter((item) => item[fold.axis] > fold.value)
      .toArray()
      .forEach((item) => {
        paper.delete(item);
        paper.add({ ...item, [fold.axis]: fold.value - (item[fold.axis] - fold.value) });
      });
    debug(1, fold, paper.originalValues(), paper.size);
    if (first) break;
  }
  return { count: paper.size, paper };
};

const part1 = () => {
  const { count } = solve(parseInput());
  console.log('part 1:', count);
};

const part2 = () => {
  const { paper } = solve(parseInput(), false);
  const [maxX, maxY] = paper
    .originalValues()
    .reduce((acc, item) => [Maths.max(acc[0], item.x), Maths.max(acc[1], item.y)], [-Infinity, -Infinity]);
  const grid: Array<Array<string>> = Array.from({ length: maxY + 1 }, () => new Array(maxX + 1).fill(' '));
  paper.originalValues().forEach((item) => (grid[item.y][item.x] = '#'));
  console.log('part 2:', '\n' + grid.map((item) => '  ' + item.join('')).join('\n'));
};

if (args.part1) part1();
if (args.part2) part2();
