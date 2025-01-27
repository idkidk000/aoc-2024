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

type Material = 'ore' | 'clay' | 'obsidian' | 'geode';
interface Blueprint {
  id: number;
  robots: Map<Material, Map<Material, number>>;
}
const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/^Blueprint (\d+): (.*)$/gm)
    .map<Blueprint>((tokens) => ({
      id: Number(tokens[1]),
      robots: new Map(
        tokens[2].matchAll(/Each (\w+) robot costs ([^.]+)./g).map((tokens) => [
          tokens[1] as Material,
          new Map(
            tokens[2]
              .split(' and ')
              .map((token) => token.split(' '))
              .map((tokens) => [tokens[1] as Material, Number(tokens[0])])
          ),
        ])
      ),
    }))
    .toArray();

const solve = (blueprint: Blueprint, moves: number) => {
  /*
    very heavily based on https://github.com/hyperneutrino/advent-of-code/blob/main/2022/day19p1.py
    i'd already tried turn-based recursive dfs and stack. this is much better
  */
  interface Inventory {
    ore: number;
    clay: number;
    obsidian: number;
    geode: number;
  }
  // maximum resources which can be expended per turn
  const resourceLimits: Inventory = {
    ore: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('ore') ?? 0), 0),
    clay: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('clay') ?? 0), 0),
    obsidian: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('obsidian') ?? 0), 0),
    geode: Infinity,
  };
  const cache = new Map<bigint, number>();
  const incrementResources = (resources: Inventory, robots: Inventory, count: number): Inventory => ({
    ore: resources.ore + robots.ore * count,
    clay: resources.clay + robots.clay * count,
    obsidian: resources.obsidian + robots.obsidian * count,
    geode: resources.geode + robots.geode * count,
  });
  // remove resources that we can't use to produce more cache hits
  const pruneResources = (resources: Inventory, remaining: number): Inventory => ({
    ore: Maths.min(resources.ore, resourceLimits.ore * remaining),
    clay: Maths.min(resources.clay, resourceLimits.clay * remaining),
    obsidian: Maths.min(resources.obsidian, resourceLimits.obsidian * remaining),
    geode: resources.geode,
  });
  const dfs = (resources: Inventory, robots: Inventory, remaining: number): number => {
    if (remaining === 0) return resources.geode;
    // bitwise ops on Number don't work beyond 31 bits. unfortunately the typecasting slows things down
    // this is about 30% faster on p2 than casting each field as a BigInt separately and using 8 bits per field
    const cacheKey =
      BigInt(resources.ore + (resources.clay << 8) + (resources.obsidian << 16) + (resources.geode << 24)) +
      (BigInt(robots.ore + (robots.clay << 6) + (robots.obsidian << 12) + (robots.geode << 18) + (remaining << 24)) << 32n);
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;
    // build nothing
    let maxGeodes = dfs(incrementResources(resources, robots, remaining), robots, 0);
    for (const [robotType, requirements] of blueprint.robots.entries()) {
      // build each type of robot where we already have the required resources being produced and we don't have resourceLimits of them
      if (requirements.keys().some((item) => robots[item] === 0) || robots[robotType] >= resourceLimits[robotType]) continue;
      const delay = requirements
        .entries()
        .reduce(
          (acc, [materialType, materialQty]) =>
            Maths.max(acc, Maths.ceil((materialQty - resources[materialType]) / robots[materialType])),
          0
        );
      const nextRemaining = remaining - delay - 1;
      if (nextRemaining <= 0) continue;
      const nextResouces = incrementResources(resources, robots, delay + 1);
      requirements.entries().forEach(([k, v]) => (nextResouces[k] -= v));
      maxGeodes = Maths.max(
        maxGeodes,
        dfs(pruneResources(nextResouces, nextRemaining), { ...robots, [robotType]: robots[robotType] + 1 }, nextRemaining)
      );
    }
    cache.set(cacheKey, maxGeodes);
    return maxGeodes;
  };
  const result = dfs({ clay: 0, geode: 0, obsidian: 0, ore: 0 }, { clay: 0, geode: 0, obsidian: 0, ore: 1 }, moves);
  debug(1, { blueprint, result });
  return result;
};

const part1 = () => {
  const blueprints = parseInput();
  const resultsMap = new Map<number, number>(blueprints.map((item) => [item.id, solve(item, 24)]));
  console.log(
    'part 1:',
    resultsMap.entries().reduce((acc, [k, v]) => acc + k * v, 0)
  );
};

const part2 = () => {
  const blueprints = parseInput();
  const result = blueprints
    .filter((_, i) => i < 3)
    .map((item) => solve(item, 32))
    .reduce((acc, item) => acc * item, 1);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
