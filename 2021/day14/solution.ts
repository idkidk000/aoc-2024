#!/usr/bin/env -S deno --allow-read
import { args, debug, Counter, Maths, MathsUtils } from '../../.template/_/utils.ts';

interface Input {
  template: string;
  rules: Map<string, string>;
}

const parseInput = (): Input => {
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');
  const template = sections[0];
  const rules = new Map<string, string>(
    sections[1].matchAll(/([A-Z]{2}) -> ([A-Z])/gm).map(([_, find, insert]) => [find, insert])
  );
  return { template, rules };
};

const solve = ({ template, rules }: Input, iterations: number) => {
  let polymer = template;
  for (let iteration = 0; iteration < iterations; ++iteration) {
    let nextPolymer = '';
    for (let i = 0; i < polymer.length - 1; ++i) {
      const section = polymer[i] + polymer[i + 1];
      nextPolymer += polymer[i] + (rules.get(section) ?? '');
    }
    nextPolymer += polymer.slice(-1)[0];
    debug(2, { iteration, length: nextPolymer.length });
    polymer = nextPolymer;
  }
  const counter = new Counter(polymer);
  debug(1, counter);
  const [min, max] = MathsUtils.minMax(...counter.values());
  return max - min;
};

const solve2 = ({ template, rules }: Input, iterations: number) => {
  // rotating pair of counters. 0 is loaded up with pairs of values from template
  const counters = [
    new Counter<string>(
      template
        .split('')
        .map((item, i, arr) => item + (arr.at(i + 1) ?? ''))
        .filter((_, i, arr) => i < arr.length - 1)
    ),
    new Counter<string>(),
  ];
  for (let iteration = 0; iteration < iterations; ++iteration) {
    for (const [pair, count] of counters[0].entries()) {
      const insert = rules.get(pair);
      // insert into next counter
      if (insert !== undefined) {
        // double insert is handled later
        counters[1].add(pair[0] + insert, count);
        counters[1].add(insert + pair[1], count);
      } else counters[1].add(pair, count);
    }
    // rotate and clear
    [counters[0], counters[1]] = [counters[1], counters[0]];
    counters[1].clear();
    debug(2, counters[0]);
  }
  // keep the left and right parts separate so we don't double count
  const elements = [new Counter(), new Counter()];
  for (const [pair, count] of counters[0]) {
    elements[0].add(pair[0], count);
    elements[1].add(pair[1], count);
  }
  // max count of each per element corresponds to the naive counts so i guess i'll use that
  const maxElements = new Map<string, number>(
    elements[0].entries().map(([k, v]) => [k as string, Maths.max(v, elements[1].get(k))])
  );
  debug(1, elements, maxElements);
  const [min, max] = MathsUtils.minMax(...maxElements.values());
  return max - min;
};

const part1 = () => {
  const result = solve(parseInput(), 10);
  const result2 = solve2(parseInput(), 10);
  console.log('part 1:', result, result2);
};

const part2 = () => {
  const result = solve2(parseInput(), 40);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
