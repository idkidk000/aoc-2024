#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item == '-d' ? 1 : item == '-d2' ? 2 : item == '-d3' ? 3 : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });
const D4 = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

const text = await Deno.readTextFile(FILENAME);
if (DEBUG > 1) console.debug({ text });
const connections = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split('-'));
if (DEBUG > 1) console.debug({ connections });

const nodeConns: Map<string, Set<string>> = new Map();
for (const nodes of connections) {
  for (const [nodeA, nodeB] of [
    [nodes[0], nodes[1]],
    [nodes[1], nodes[0]],
  ]) {
    if (nodeConns.has(nodeA)) {
      nodeConns.get(nodeA)!.add(nodeB);
    } else {
      nodeConns.set(nodeA, new Set([nodeB]));
    }
  }
}
if (DEBUG > 1) console.debug({ nodeConns });

const part1 = () => {
  const triplets: Set<string> = new Set();
  for (const [nodeA, nodeAConns] of nodeConns.entries()) {
    for (const nodeB of nodeAConns) {
      for (const nodeC of nodeConns.get(nodeB)!) {
        if (nodeAConns.has(nodeC)) {
          if ([nodeA, nodeB, nodeC].some((n) => n[0] === 't')) {
            triplets.add(JSON.stringify([nodeA, nodeB, nodeC].toSorted()));
          }
        }
      }
    }
  }
  if (DEBUG > 0) console.debug({ triplets });
  console.log('part 1:', triplets.size);
};

const part2 = () => {
  const walk = (node: string, network: Set<string>) => {
    for (const conn of nodeConns.get(node)!) {
      if (network.has(conn)) continue;
      if (nodeConns.get(conn)!.isSupersetOf(network)) {
        network.add(conn);
        walk(conn, network);
      }
    }
  };

  const networks: Array<Set<string>> = [];
  for (const node of nodeConns.keys()) {
    const network = new Set([node]);
    walk(node, network);
    networks.push(network);
  }

  const largestNetwork = networks.toSorted((a, b) => b.size - a.size)[0];
  if (DEBUG > 0) console.debug({ largestNetwork });

  const password = [...largestNetwork].toSorted().join(',');
  console.log('part 2:', password);
};

part1();
part2();
