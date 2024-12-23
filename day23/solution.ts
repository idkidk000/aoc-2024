#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item == '-d' ? 1 : item == '-d2' ? 2 : item == '-d3' ? 3 : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

const text = await Deno.readTextFile(FILENAME);
if (DEBUG > 1) console.debug({ text });

// break into a 2xn array
const connections = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split('-'));
if (DEBUG > 1) console.debug({ connections });

// build a map of nodes and a set of their connections
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
  // since duplication does matter here and our networks must have 3 items, use a set of strs and a series of loops
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
  // recursively walk the node's connections and add any fully-connected nodes to the network
  const walk = (node: string, network: Set<string>) => {
    for (const conn of nodeConns.get(node)!) {
      if (network.has(conn)) continue;
      if (nodeConns.get(conn)!.isSupersetOf(network)) {
        network.add(conn);
        walk(conn, network);
      }
    }
  };

  // networks will be full of dupes but it doesn't really matter
  const networks: Array<Set<string>> = [];
  for (const node of nodeConns.keys()) {
    const network = new Set([node]);
    walk(node, network);
    networks.push(network);
  }

  const password = [...networks.toSorted((a, b) => b.size - a.size)[0]].toSorted().join(',');
  console.log('part 2:', password);
};

part1();
part2();
