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
  debug(1, blueprints);
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
  const queueRank = (item: QueueEntry): number =>
    (item.resources.geode + item.robots.geode * item.remaining) * 1000000 +
    (item.resources.obsidian + item.robots.obsidian * item.remaining) * 10000 +
    (item.resources.clay + item.robots.clay * item.remaining) * 100 +
    (item.resources.ore + item.robots.ore * item.remaining);
  const queue = new BinaryHeap<QueueEntry>((a, b) => queueRank(b) - queueRank(a)); //highest first clownface
  /*   const incrementResources = (robots: Inventory, resources: Inventory) => ({
    ore: resources.ore + robots.ore,
    clay: resources.clay + robots.clay,
    obsidian: resources.obsidian + robots.obsidian,
    geode: resources.geode + robots.geode,
  }); */

  // const cache = new Map<string, number>();
  // too many records to memoise :|
  // it might be stack time

  /*   const dfs = (blueprint: Blueprint, robots: Inventory, resources: Inventory, remaining: number): number => {
    if (remaining === 0) {
      debug(1, { robots, resources, remaining });
      return resources.geode;
    }
    if (remaining < 0) throw new Error('bruh');
    //TODO: it properly
    // const cacheKey = `${blueprint.id} ${robots.clay} ${robots.geode} ${robots.obsidian} ${robots.ore} ${resources.clay} ${resources.geode} ${resources.obsidian} ${resources.ore} ${remaining}`;
    // if (cache.has(cacheKey)) return cache.get(cacheKey)!;
    let maxResult = -Infinity;
    for (const [robotType, robotReqs] of blueprint.robots.entries().toArray().toReversed()) {
      const nextResources = { ...resources };
      for (const [resourceType, resourceCount] of robotReqs.requires.entries()) nextResources[resourceType] -= resourceCount;
      if (nextResources.clay < 0 || nextResources.geode < 0 || nextResources.obsidian < 0 || nextResources.ore < 0) continue;
      maxResult = Maths.max(
        maxResult,
        dfs(
          blueprint,
          { ...robots, [robotType]: robots[robotType] + 1 },
          incrementResources(robots, nextResources),
          remaining - 1
        )
      );
    }
    maxResult = Maths.max(maxResult, dfs(blueprint, robots, incrementResources(robots, resources), remaining - 1));
    // cache.set(cacheKey, maxResult);
    return maxResult;
  } */
  const resultSummary = new Array<{ blueprintId: number; maxGeodes: number; qualityLevel: number }>();
  for (const blueprint of blueprints) {
    // const maxGeodes = dfs(blueprint, { ore: 1, clay: 0, obsidian: 0, geode: 0 }, { ore: 0, clay: 0, obsidian: 0, geode: 0 }, 24);
    queue.push({
      robots: { ore: 1, clay: 0, obsidian: 0, geode: 0 },
      resources: { ore: 0, clay: 0, obsidian: 0, geode: 0 },
      remaining: 24,
    });
    let maxGeodes = 0;
    let lastMax = performance.now();
    while (queue.size > 0) {
      const state = queue.pop()!;
      debug(2, state);
      if (state.remaining === 0) {
        //FIXME: maybe need to accumulate resources here or change to remaining===-1
        if (state.resources.geode > maxGeodes) {
          maxGeodes = state.resources.geode;
          lastMax = performance.now();
          debug(1, { maxGeodes, state, blueprint, qsize: queue.size });
        }
        continue;
      }

      //TODO: improve pruning a lot
      if (state.resources.ore > 50 || state.resources.clay > 50) continue;
      // if (state.robots.geode === 0 && state.remaining < maxGeodes - 3) continue;
      if (state.robots.obsidian === 0 && state.remaining < blueprint.robots.get('geode')!.get('obsidian')!) continue;
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
        robots: { ...state.robots },
        resources: nextResources,
        remaining: state.remaining - 1,
      });
    }
    resultSummary.push({ blueprintId: blueprint.id, maxGeodes, qualityLevel: blueprint.id * maxGeodes });
    debug(1, { resultSummary });
  }
  debug(1, { resultSummary });
  const result = resultSummary.reduce((acc, item) => acc + item.qualityLevel, 0);
  console.log('part 1:', result);

  // 1183 too low ofc
  // not 1283 either
};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
