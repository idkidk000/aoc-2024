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
  neighbours: Array<string>;
}
const parseInput = () =>
  new Map<string, Node>(
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

const solve = (nodeMap: Map<string, Node>, start: string = 'AA', moves: number = 30) => {
  const nodesWithValue = nodeMap
    .entries()
    .filter(([k, v]) => k === start || v.flow > 0)
    .map(([k, _]) => k)
    .toArray()
    .toSorted((a, b) => a.localeCompare(b));
  const shortestPaths = new Map<string, Map<string, number>>(nodesWithValue.map((item) => [item, new Map<string, number>()]));
  //FIXME: this part is quite slow
  for (const left of nodesWithValue) {
    for (const right of nodesWithValue) {
      if (left === right || shortestPaths.get(left)!.has(right)) continue;
      const queue = new Array<{ node: string; cost: number }>();
      let shortest = Infinity;
      queue.push({ node: left, cost: 0 });
      while (queue.length) {
        const { node, cost } = queue.shift()!;
        if (cost >= shortest) continue;
        if (node === right) {
          shortest = Maths.min(shortest, cost);
        }
        for (const neighbour of nodeMap.get(node)!.neighbours) {
          queue.push({ node: neighbour, cost: cost + 1 });
        }
      }
      debug(1, { left, right, shortest });
      shortestPaths.get(left)!.set(right, shortest);
      shortestPaths.get(right)!.set(left, shortest);
    }
  }
  debug(1, { shortestPaths });

  // recursive dfs with higher (next node value * remaining) prioritised. though i seem to have an error somewhere because the best score isn't first
  // p2 is a bit of brain melter. i think the "decrement remain by nextNode.path" optimisation will have to go and the two active nodes will need to have a position, destination, and moves remaining to get there. other state can still be shared
  const nodeState = new Map<string, boolean>(nodesWithValue.map((item) => [item, false]));
  let highestScore = -Infinity;
  const walk = (node: string, remain: number, score: number = 0, scorePerMove: number = 0) => {
    if (remain === 1) {
      if (score + scorePerMove > highestScore) {
        debug(1, { node, remain, score, scorePerMove, finalScore: score + scorePerMove, highestScore, nodeState });
        highestScore = score + scorePerMove;
      }
      return;
    }
    if (remain < 1) throw new Error('bruh');
    if (nodeState.get(node) === false && nodeMap.get(node)!.flow > 0) {
      // open, walk, close
      nodeState.set(node, true);
      walk(node, remain - 1, score + scorePerMove, scorePerMove + nodeMap.get(node)!.flow);
      nodeState.set(node, false);
    } else {
      // this might produce no entries...
      for (const nextNode of nodeState
        .entries()
        .filter(([k, v]) => !v && k !== node)
        .map(([k, _]) => ({ node: k, flow: nodeMap.get(k)!.flow, path: shortestPaths.get(node)!.get(k)! }))
        .filter((item) => item.flow > 0 && item.path < remain - 1)
        .toArray()
        .sort((a, b) => (remain - b.path) * b.flow - (remain - a.path) * a.flow)) {
        walk(nextNode.node, remain - nextNode.path, score + scorePerMove * nextNode.path, scorePerMove);
      }
      // ...so also test just waiting here until the end
      walk(node, 1, score + scorePerMove * (remain - 1), scorePerMove);
    }
  };
  walk(start, moves);
  return highestScore;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);
  // 1474
};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
