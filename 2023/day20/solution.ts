#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    gcd(left: number, right: number): number;
    lcm(values: number[]): number;
  }
}

Math.gcd = (left: number, right: number) => {
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};
Math.lcm = (values: number[]) => values.reduce((acc, item) => (acc * item) / Math.gcd(acc, item), 1);

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

class Deque<T> {
  private ring: T[];
  private front: number = 0;
  private back: number = 0;
  constructor(public length: number) {
    this.ring = new Array<T>(length);
  }
  pushFront = (...items: T[]) => {
    for (const item of items) {
      this.front = (this.front - 1 + this.length) % this.length;
      if (this.front == this.back) throw new Error('bruh');
      this.ring[this.front] = item;
    }
  };
  pushBack = (...items: T[]) => {
    for (const item of items) {
      this.ring[this.back] = item;
      this.back = (this.back + 1) % this.length;
      if (this.front == this.back) throw new Error('bruh');
    }
  };
  popFront = () => {
    const item = this.ring[this.front];
    this.front = (this.front + 1) % this.length;
    return item;
  };
  popBack = () => {
    this.back = (this.back - 1 + this.length) % this.length;
    return this.ring[this.back];
  };
  get empty() {
    return this.front === this.back;
  }
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
const input = await Deno.readTextFile(args.filename);
// #endregion

type NodeType = '%' | '&' | undefined;
interface Node {
  type: NodeType;
  targets: Array<string>;
}
interface FlipFlop extends Node {
  state: boolean;
}
interface Conjunction extends Node {
  inputs: Map<string, boolean>;
}

const parseInput = () => {
  const regex = /^([%&])?([a-z]+) -> ([a-z, ]+)$/gm;
  const nodes = new Map<string, Node | FlipFlop | Conjunction>(
    input.matchAll(regex).map((match) => [
      match[2],
      {
        type: match[1] as NodeType,
        targets: match[3].split(', '),
      } as Node,
    ])
  );
  // populate flipflop state
  nodes
    .entries()
    .filter(([_, v]) => v.type === '%')
    .forEach(([k, v]) => nodes.set(k, { ...v, state: false } as FlipFlop));
  // populate conjunction inputs
  nodes
    .entries()
    .filter(([_, conjunction]) => conjunction.type === '&')
    .forEach(([conjunctionName, conjunction]) => {
      nodes.set(conjunctionName, {
        ...conjunction,
        inputs: new Map<string, boolean>(
          nodes
            .entries()
            .filter(([_, v]) => v.targets.includes(conjunctionName))
            .map(([k, _]) => [k, false])
        ),
      } as Conjunction);
    });
  debug(3, nodes);
  return nodes;
};

const simulate = (
  nodes: Map<string, Node | FlipFlop | Conjunction>,
  stateHook?: (sender: string, target: string, state: boolean) => void
) => {
  interface Event {
    sender: string;
    target: string;
    state: boolean;
  }
  //FIXME: update Deque to grow dynamically. maybe start at 1000 and double in size whenever it becomes full?
  const queue = new Deque<Event>(100);
  queue.pushBack({ sender: 'button', target: 'broadcaster', state: false });
  while (!queue.empty) {
    const event = queue.popFront();
    if (typeof stateHook !== 'undefined') stateHook(event.sender, event.target, event.state);
    const node = nodes.get(event.target);
    if (typeof node === 'undefined') continue;
    if (node.type === '%') {
      // flip flop - low flips, high ignored
      if (event.state === false) {
        (node as FlipFlop).state = !(node as FlipFlop).state;
        queue.pushBack(...node.targets.map((target) => ({ sender: event.target, target, state: (node as FlipFlop).state })));
      }
    } else if (node.type === '&') {
      // conjunction. all high -> send low. otherwise, send high
      (node as Conjunction).inputs.set(event.sender, event.state);
      const sendState = !(node as Conjunction).inputs.values().reduce((acc, item) => acc && item, true);
      queue.pushBack(...node.targets.map((target) => ({ sender: event.target, target, state: sendState })));
    } else {
      queue.pushBack(...node.targets.map((target) => ({ sender: event.target, target, state: event.state })));
    }
  }
};

const part1 = () => {
  const nodes = parseInput();
  let [lowCount, highCount] = [0, 0];
  for (let i = 0; i < 1000; ++i)
    simulate(nodes, (_s, _t, state) => {
      if (state) ++highCount;
      else ++lowCount;
    });
  debug(1, { lowCount, highCount });
  console.log('part 1:', lowCount * highCount);
};

const part2 = () => {
  const nodes = parseInput();
  const rxL1 = new Set(
    nodes
      .entries()
      .filter(([_, v]) => v.targets.includes('rx'))
      .map(([k, _]) => k)
  );
  debug(1, { rxL1 });
  // watch rx's l2 drivers
  const watchNodes = new Map<string, Array<number>>(
    nodes
      .entries()
      .filter(([_, v]) => rxL1.intersection(new Set(v.targets)).size > 0)
      .map(([k, _]) => [k, new Array<number>()])
  );
  debug(1, { watchNodes });
  let i = 0;
  // loop until we have 5 values for all watched nodes
  while (watchNodes.values().some((item) => item.length < 5)) {
    i++;
    simulate(nodes, (sender, _, state) => {
      if (state && watchNodes.has(sender)) watchNodes.get(sender)!.push(i);
    });
  }
  debug(1, watchNodes);
  // map cycle number to deltas
  const deltas = watchNodes
    .values()
    .map((history) => history.map((item, i, arr) => arr[i + 1] - item).filter((_, i, arr) => i < arr.length - 1))
    .toArray();
  debug(1, { deltas });
  // assert that each node has only one distinct delta value
  if (deltas.some((item) => new Set<number>(item.values()).size > 1)) throw new Error('bruh');
  const firstDeltas = deltas.map((item) => item[0]);
  debug(1, { firstDeltas });
  // then lcm the deltas
  const cycleCount = Maths.lcm(firstDeltas);
  debug(1, { cycleCount });
  console.log('part 2:', cycleCount);
};

if (args.part1) part1();
if (args.part2) part2();
