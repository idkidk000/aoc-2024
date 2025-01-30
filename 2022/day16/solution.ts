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

interface Node {
  flow: number;
  neighbours: Map<number, number>;
}

const parseInput = () => {
  const allNodes = new Map<string, { flow: number; neighbours: Array<string> }>(
    Deno.readTextFileSync(args.filename)
      .matchAll(/^Valve (\w+) has flow rate=(\d+); tunnels? leads? to valves? ([\w, ]+)$/gm)
      .map((tokens) => [
        tokens[1],
        {
          flow: Number(tokens[2]),
          neighbours: tokens[3].split(', '),
        },
      ])
  );

  // collapse nodes to only start and those with flow rate. bfs shortest paths
  const start = 'AA';
  const nodesWithFlowRate = allNodes
    .entries()
    .filter(([k, v]) => k === start || v.flow > 0)
    .map(([k, _]) => k)
    .toArray()
    .toSorted((a, b) => a.localeCompare(b));

  const nodeMapStr = new Map<string, { flow: number; neighbours: Map<string, number> }>(
    nodesWithFlowRate.map((item) => [item, { flow: allNodes.get(item)!.flow, neighbours: new Map<string, number>() }])
  );

  const queue = new Array<{ node: string; cost: number }>();
  const nodeCosts = new Map<string, number>();

  for (const [i, left] of nodesWithFlowRate.entries()) {
    for (const right of nodesWithFlowRate.slice(i + 1)) {
      let shortest = Infinity;
      nodeCosts.clear();
      nodeCosts.set(left, 0);
      queue.push({ node: left, cost: 0 });
      while (queue.length) {
        const { node, cost } = queue.shift()!;
        if (node === right) {
          shortest = Maths.min(shortest, cost);
          continue;
        }
        if (Maths.min(nodeCosts.get(node) ?? Infinity, shortest) < cost) continue;
        nodeCosts.set(node, cost);
        for (const neighbour of allNodes.get(node)!.neighbours) queue.push({ node: neighbour, cost: cost + 1 });
      }
      debug(3, { left, right, shortest });
      // start node has no flow value - don't add paths back to it
      if (right !== start) nodeMapStr.get(left)!.neighbours.set(right, shortest);
      if (left !== start) nodeMapStr.get(right)!.neighbours.set(left, shortest);
    }
  }
  debug(3, { nodeMapStr });

  // this is quite dirty, but remap node ids to numbers so their ids can toggle individual bits in the cache key
  const nodes = nodeMapStr
    .keys()
    .toArray()
    .toSorted((a, b) => a.localeCompare(b));
  const nodeMap = new Map<number, Node>();
  for (const [nodeName, nodeInfo] of nodeMapStr.entries()) {
    const neighbours = new Map<number, number>();
    for (const [neighbourStr, neighbourCost] of nodeInfo.neighbours.entries())
      neighbours.set(
        nodes.findIndex((value) => value === neighbourStr),
        neighbourCost
      );
    nodeMap.set(
      nodes.findIndex((value) => value === nodeName),
      { flow: nodeInfo.flow, neighbours }
    );
  }
  debug(1, nodeMap);
  return nodeMap;
};

const solve = (
  nodeMap: Map<number, Node>,
  moves = 30,
  // set all valves to closed
  nodeState: Map<number, boolean> = new Map<number, boolean>(nodeMap.keys().map((item) => [item, false])),
  cache?: Map<number, number>
) => {
  const start = 0;
  // recursive dfs since there's a lot of state
  const walk = (node: number, remain: number, score: number = 0): number => {
    if (remain === 1) return score;
    if (remain < 1) throw new Error('bruh');
    if (nodeState.get(node) === false && node !== start) {
      // key is node, remain, and closed valves
      const cacheKey =
        typeof cache !== 'undefined'
          ? nodeState
              .entries()
              .filter(([_, v]) => !v)
              .reduce((acc, [k, _]) => acc | (1 << k), (node << 26) + (remain << 21))
          : undefined;
      if (typeof cache !== 'undefined' && cache.has(cacheKey!)) return score + cache.get(cacheKey!)!;
      // open, walk, close
      nodeState.set(node, true);
      // deliberately not passing score to the walk call so we can memoise the result
      const nodeScore = walk(node, remain - 1, nodeMap.get(node)!.flow * (remain - 1));
      nodeState.set(node, false);
      if (typeof cache !== 'undefined') cache.set(cacheKey!, nodeScore);
      return score + nodeScore;
    } else {
      // wait here until the end
      let highestScore = score;
      // walk each node with a closed valved which can be reached and opened in remaining moves
      // casting as array and sorting highest gain first is slower
      // walking only top n / gain>=mean/median prunes paths which are initially bad but become optimal
      for (const nextNode of nodeState
        .entries()
        .filter(([k, v]) => !v && k !== node)
        .map(([k, _]) => ({ node: k, flow: nodeMap.get(k)!.flow, cost: nodeMap.get(node)!.neighbours.get(k)! }))
        .filter((item) => item.cost < remain - 2)) {
        highestScore = Maths.max(highestScore, walk(nextNode.node, remain - nextNode.cost, score));
      }
      return highestScore;
    }
  };

  return walk(start, moves);
};

const part1 = () => {
  console.log('part 1:', solve(parseInput()));
  // 1474
};

const part2 = () => {
  const nodeMap = parseInput();
  // brute force unfortunately but memoisation helps a lot. 1m30 -> 0m23
  const resultMap = new Map<number, number>();
  const nodeState = new Map<number, boolean>(nodeMap.keys().map((item) => [item, false]));
  const nodeArr = nodeMap.keys().toArray();
  const upper = (1 << (nodeArr.length - 1)) - 1;
  const cache = new Map<number, number>();
  for (let i = 0; i <= upper; ++i) {
    for (const [j, node] of nodeArr.entries()) nodeState.set(node, ((1 << (j - 1)) & i) > 0);
    debug(2, { i, nodeState, upper });
    const result = solve(nodeMap, 26, nodeState, cache);
    if (i % 1000 === 0) debug(1, Maths.round((1000 / upper) * i) / 10, '%', { i, upper, result });
    resultMap.set(i, result);
  }
  let highestScore = -Infinity;
  for (let i = 0; i <= upper; ++i) {
    highestScore = Maths.max(highestScore, resultMap.get(i)! + resultMap.get(upper ^ i)!);
  }
  console.log('part 2:', highestScore);

  // 2100
};

if (args.part1) part1();
if (args.part2) part2();
