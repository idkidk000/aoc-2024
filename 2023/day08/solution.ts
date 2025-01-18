#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item.startsWith('-d') ? Number(item.slice(2) || '1') : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) => (item == '-i' ? 'input.txt' : item.startsWith('-e') ? `example${item.slice(2)}.txt` : acc),
  'example.txt'
);
const [PART1, PART2] = Deno.args.reduce(
  (acc, item) => (item == '-p0' ? [false, false] : item == '-p1' ? [true, false] : item == '-p2' ? [false, true] : acc),
  [true, true]
);

console.log({ FILENAME, DEBUG, PART1, PART2 });

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (DEBUG >= level) console.debug(...data);
};

const input = await Deno.readTextFile(FILENAME);

const parseInput = () => {
  const sections = input.split('\n\n');
  const directions = sections[0].split('').map((c) => (c == 'L' ? 0 : 1));
  const network = new Map(
    sections[1]
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const tokens = line.split(/[\s=(),]+/);
        return [tokens[0], [tokens[1], tokens[2]]];
      })
  );
  return { directions, network };
};

const part1 = () => {
  const { directions, network } = parseInput();
  debug(1, { network, directions });
  // ugh let
  let node = 'AAA',
    step = 0;
  while (node != 'ZZZ') {
    const direction = directions[step % directions.length];
    debug(1, { node, step, direction });
    node = network.get(node)![direction];
    ++step;
  }
  console.log('part 1:', step);
};

const gcd = (left: number, right: number) => {
  while (right != 0) {
    [left, right] = [right, left % right];
  }
  return left;
};

const lcm = (values: number[]) => values.reduce((acc, item) => (acc * item) / gcd(acc, item), 1);

const part2 = () => {
  const { directions, network } = parseInput();
  const startNodes = network.keys().filter((n) => n.endsWith('A'));
  const loopEnds = new Map<string, number>();
  const loopStarts = new Map<string, number>();
  for (const startNode of startNodes) {
    let node = startNode;
    let step = 0;
    // paths don't loop back to A, which is something i did not consider in the python solve. i suppose the input must intentionally have loop starts which are multiples of the loop lengths
    const history = new Map<string, number>();
    while (1) {
      history.set(node, step);
      const direction = directions[step % directions.length];
      debug(3, { node, step, direction });
      node = network.get(node)![direction];
      ++step; // increment before store
      if (loopEnds.has(startNode) && history.has(node)) {
        debug(2, { msg: 'loop', node, step });
        loopStarts.set(startNode, history.get(node)!);
        break;
      }
      if (node.endsWith('Z')) {
        debug(2, { msg: 'end', node, step });
        if (!loopEnds.has(startNode)) loopEnds.set(startNode, step);
      }
    }
    debug(1, { startNode, loopStart: loopStarts.get(startNode), loopEnd: loopEnds.get(startNode) });
  }
  const cyclesAlign = lcm(loopEnds.values().toArray());
  console.log('part 2:', cyclesAlign);
};

if (PART1) part1();
if (PART2) part2();
