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

interface Pair {
  left: string;
  right: string;
}

const parseInput = () =>
  // parse as a sorted array of sorted pairs
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(': '))
    .flatMap(([left, rights]) => rights.split(/\s+/).map<Pair>((right) => ({ left, right })))
    .map(({ left, right }) => (left.localeCompare(right) <= 0 ? { left, right } : { left: right, right: left }))
    .toSorted((a, b) => a.left.localeCompare(b.left) || a.right.localeCompare(b.right));

const kargerMinCut = (connections: Array<Pair>) => {
  // python implementation was loosely based on: https://www.geeksforgeeks.org/introduction-and-implementation-of-kargers-algorithm-for-minimum-cut/
  const collapsedMap = new Map<string, { parent: string; rank: number }>(
    connections.flatMap((item) => [item.left, item.right]).map((item) => [item, { parent: item, rank: 0 }])
  );
  const getParent = (node: string): string =>
    collapsedMap.get(node)!.parent === node ? node : getParent(collapsedMap.get(node)!.parent);
  let remainCount = [...collapsedMap.keys()].length - 2;
  while (remainCount > 0) {
    const pair = connections.at(Maths.floor(Maths.random() * connections.length))!;
    const [left, right] = [getParent(pair.left), getParent(pair.right)];
    if (left === right) continue;
    const rankDiff = collapsedMap.get(left)!.rank - collapsedMap.get(right)!.rank;
    if (rankDiff < 0) collapsedMap.get(left)!.parent = right;
    else if (rankDiff > 0) collapsedMap.get(right)!.parent = left;
    else {
      collapsedMap.get(right)!.parent = left;
      ++collapsedMap.get(left)!.rank;
    }
    --remainCount;
  }
  return connections.filter((item) => getParent(item.left) !== getParent(item.right));
};

const mapNetwork = (connectionMap: Map<string, Array<string>>, startNode: string) => {
  const network = new Set<string>([startNode]);
  const walk = (node: string) =>
    // for/of is faster but this isn't performance critical
    connectionMap
      .get(node)!
      .filter((neighbour) => !network.has(neighbour))
      .forEach((neighbour) => {
        network.add(neighbour);
        walk(neighbour);
      });
  walk(startNode);
  return network;
};

const part1 = () => {
  const connectionPairs = parseInput();
  debug(3, connectionPairs);
  // karger min cut is non-deterministic so we just have to brute force it until we get the required 3 cuts :|
  let cuts: Array<Pair>;
  while ((cuts = kargerMinCut(connectionPairs)).length !== 3) debug(2, { cuts });
  debug(1, 'found', { cuts });

  // filter cuts from the pairs and convert into a map of arrays
  // the filtering would be faster if connectionPairs was a set, but the brute force above is the slow part
  const connectionMap = new Map<string, Array<string>>();
  connectionPairs
    .filter((item) => !cuts.some((cut) => cut.left === item.left && cut.right === item.right))
    .forEach((item) => {
      connectionMap.has(item.left) ? connectionMap.get(item.left)!.push(item.right) : connectionMap.set(item.left, [item.right]);
      connectionMap.has(item.right) ? connectionMap.get(item.right)!.push(item.left) : connectionMap.set(item.right, [item.left]);
    });
  debug(3, { connectionMap });
  const nodes = new Set<string>(connectionMap.keys());

  // walk the network, return reachable nodes
  const leftNetwork = mapNetwork(connectionMap, [...nodes.values()][0]);
  debug(3, { leftNetwork });
  const rightNetwork = mapNetwork(connectionMap, [...nodes.difference(leftNetwork)][0]);
  debug(3, { rightNetwork });

  const result = leftNetwork.size * rightNetwork.size;
  console.log('part 1:', result);
};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
