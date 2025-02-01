#!/usr/bin/env -S deno --allow-read
import { args, Counter, Maths } from '../../.template/_/utils.ts';

const parseInput = () => {
  const edges = new Map<string, Array<string>>();
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('-'))
    .forEach(([left, right]) => {
      if (left !== 'end' && right !== 'start')
        edges.has(left) ? edges.get(left)!.push(right) : edges.set(left, new Array<string>(right));
      if (left !== 'start' && right !== 'end')
        edges.has(right) ? edges.get(right)!.push(left) : edges.set(right, new Array<string>(left));
    });
  return edges;
};

const solve = (edges: Map<string, Array<string>>, multi = false) => {
  const walked = new Counter<string>();
  const walk = (node: string): number => {
    if (node === 'end') return 1;
    return edges
      .get(node)!
      .filter((item) => walked.get(item) === 0 || (multi && Maths.max(...walked.values()) < 2))
      .map((item) => {
        if (item.toLowerCase() === item) walked.add(item);
        const count = walk(item);
        if (item.toLowerCase() === item) walked.add(item, -1);
        return count;
      })
      .reduce((acc, item) => acc + item, 0);
  };
  return walk('start');
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1', result);
};

const part2 = () => {
  const result = solve(parseInput(), true);
  console.log('part 2', result);
};

if (args.part1) part1();
if (args.part2) part2();
