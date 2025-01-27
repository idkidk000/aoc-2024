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

class BinaryHeap<T> {
  private heap: T[] = [];
  constructor(public comparator: (a: T, b: T) => number) {}
  get size(): number {
    return this.heap.length;
  }
  push = (value: T) => {
    this.heap.push(value);
    this.siftUp();
  };
  pop = () => {
    if (this.size === 0) return undefined;
    const top = this.heap[0];
    const end = this.heap.pop()!;
    if (this.size > 0) {
      this.heap[0] = end;
      this.siftDown();
    }
    return top;
  };
  private siftUp = () => {
    let idx = this.size - 1;
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.comparator(element, parent) >= 0) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = element;
  };
  private siftDown = () => {
    let idx = 0;
    const length = this.size;
    const element = this.heap[0];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = -1;

      if (leftIdx < length && this.comparator(this.heap[leftIdx], element) < 0) {
        swapIdx = leftIdx;
      }
      if (rightIdx < length && this.comparator(this.heap[rightIdx], this.heap[swapIdx === -1 ? idx : leftIdx]) < 0) {
        swapIdx = rightIdx;
      }
      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = element;
  };
}

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

const part1 = () => {
  const blueprints = parseInput();
  interface Inventory {
    ore: number;
    clay: number;
    obsidian: number;
    geode: number;
  }
  interface QueueEntry {
    robots: Inventory;
    resources: Inventory;
    remaining: number;
  }

  const resultSummary = new Array<{ blueprintId: number; maxGeodes: number; qualityLevel: number }>();
  for (const blueprint of blueprints) {
    //TODO: can this be improved?
    const queueRank = (item: QueueEntry) =>
      (item.resources.geode + item.robots.geode * item.remaining) * 1000000 +
      (item.resources.obsidian + item.robots.obsidian * item.remaining) * 10000 +
      (item.resources.clay + item.robots.clay * item.remaining) * 100 +
      (item.resources.ore + item.robots.ore * item.remaining);
    const queue = new BinaryHeap<QueueEntry>((a, b) => queueRank(b) - queueRank(a));
    const resourceLimits: Inventory = {
      ore: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('ore') ?? 0), 0),
      clay: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('clay') ?? 0), 0),
      obsidian: blueprint.robots.values().reduce((acc, item) => Maths.max(acc, item.get('obsidian') ?? 0), 0),
      geode: Infinity,
    };
    debug(1, { resourceLimits, blueprint });
    queue.push({
      robots: { ore: 1, clay: 0, obsidian: 0, geode: 0 },
      resources: { ore: 0, clay: 0, obsidian: 0, geode: 0 },
      remaining: 24,
    });
    let maxGeodes = 0;
    let lastMax = performance.now();
    while (queue.size > 0) {
      const state = queue.pop()!;
      debug(3, state);
      if (state.remaining === 0) {
        if (state.resources.geode >= maxGeodes) lastMax = performance.now();
        if (state.resources.geode > maxGeodes) {
          maxGeodes = state.resources.geode;
          debug(2, { maxGeodes, state, qsize: queue.size });
        }
        continue;
      }
      if (
        state.resources.ore > resourceLimits.ore * 3 ||
        state.resources.clay > resourceLimits.clay * 3 ||
        state.resources.geode > resourceLimits.geode * 3
      )
        continue;
      //TODO: improve pruning a lot
      // if (state.resources.ore > 50 || state.resources.clay > 50) continue;
      // if (state.robots.geode === 0 && state.remaining < maxGeodes - 3) continue;
      // if (state.robots.obsidian === 0 && state.remaining < blueprint.robots.get('geode')!.get('obsidian')!) continue;
      if (lastMax > -1 && performance.now() - lastMax > 30_000) continue; //bail if we haven't set a new max in 10 sec
      // if (state.resources.obsidian === 0 && blueprint.robots.get('geode')!.requires.get('obsidian')! > state.remaining) continue;
      // if (state.remaining < 20 && state.robots.ore === 0) continue;
      // if (state.remaining < 15 && state.robots.clay === 0) continue;
      // if (state.remaining < 10 && state.robots.obsidian === 0) continue;
      // // if (
      // //   state.remaining < blueprint.robots.get('geode')!.requires.get('obsidian')! + maxGeodes - 2 &&
      // //   state.robots.obsidian === 0
      // // )
      // //   continue;
      // if (queue.size % 10000 === 0) debug(1, { qsize: queue.size });

      for (const [robotType, robotRequirements] of blueprint.robots.entries()) {
        const nextResources = { ...state.resources };
        for (const [requiredResource, requiredResourceCount] of robotRequirements.entries())
          nextResources[requiredResource] -= requiredResourceCount;
        if (nextResources.clay < 0 || nextResources.geode < 0 || nextResources.obsidian < 0 || nextResources.ore < 0) continue;
        for (const resourceType of blueprint.robots.keys()) nextResources[resourceType] += state.robots[resourceType];
        queue.push({
          robots: { ...state.robots, [robotType]: state.robots[robotType] + 1 },
          resources: nextResources,
          remaining: state.remaining - 1,
        });
      }

      const nextResources = { ...state.resources };
      for (const resourceType of blueprint.robots.keys()) nextResources[resourceType] += state.robots[resourceType];
      queue.push({
        robots: state.robots,
        resources: nextResources,
        remaining: state.remaining - 1,
      });
    }
    resultSummary.push({ blueprintId: blueprint.id, maxGeodes, qualityLevel: blueprint.id * maxGeodes });
    debug(1, { resultSummary, total: resultSummary.reduce((acc, item) => acc + item.qualityLevel, 0) });
  }
  const result = resultSummary.reduce((acc, item) => acc + item.qualityLevel, 0);
  console.log('part 1:', result);

  // 1183 too low ofc
  // not 1283 either
};

const solve = (blueprint: Blueprint) => {
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
  const width = 8n; //255 maxval should be fine. i'm sure p2 won't be even worse. that never happens.
  const dfs = (resources: Inventory, robots: Inventory, remaining: number): number => {
    if (remaining === 0) return resources.geode;
    // bitwise ops on Number don't work beyond 31 bits. unfortunately the typecasting slows things down
    const cacheKey =
      BigInt(resources.ore) +
      (BigInt(resources.clay) << (width * 1n)) +
      (BigInt(resources.obsidian) << (width * 2n)) +
      (BigInt(resources.geode) << (width * 3n)) +
      (BigInt(robots.ore) << (width * 4n)) +
      (BigInt(robots.clay) << (width * 5n)) +
      (BigInt(robots.obsidian) << (width * 6n)) +
      (BigInt(robots.geode) << (width * 7n)) +
      (BigInt(remaining) << (width * 8n));
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
  return dfs({ clay: 0, geode: 0, obsidian: 0, ore: 0 }, { clay: 0, geode: 0, obsidian: 0, ore: 1 }, 24);
};

const part1_2 = () => {
  const blueprints = parseInput();
  const resultsMap = new Map<number, number>(blueprints.map((item) => [item.id, solve(item)]));
  console.log(
    'part 1:',
    resultsMap.entries().reduce((acc, [k, v]) => acc + k * v, 0)
  );
};

const part2 = () => {};

if (args.part1) part1_2();
if (args.part2) part2();
