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

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

type MonkeOperator = '+' | '-' | '*' | '/';
type MonkeValue = number | 'old';
interface Monke {
  id: number;
  items: Array<number>;
  operation: {
    operator: MonkeOperator;
    value: MonkeValue;
  };
  test: {
    value: number;
    true: number;
    false: number;
  };
}

// regex final boss
const parseInput = () =>
  new Map<number, Monke>(
    Deno.readTextFileSync(args.filename)
      .matchAll(
        /^Monkey (\d+):\s+Starting items: ([0-9, ]*)\s+Operation: new = old ([+*/-]) (old|\d+)\s+Test: divisible by (\d+)\s+If true: throw to monkey (\d+)\s+If false: throw to monkey (\d+)$/gm
      )
      .map<Monke>((match) => ({
        id: Number(match[1]),
        items: match[2].split(', ').map((token) => Number(token)),
        operation: {
          operator: match[3] as MonkeOperator,
          value: match[4] === 'old' ? match[4] : Number(match[4]),
        },
        test: {
          value: Number(match[5]),
          true: Number(match[6]),
          false: Number(match[7]),
        },
      }))
      .map((item) => [item.id, item])
  );

interface SimulationHook {
  id: number;
  item: number;
  nextItem: number;
  test: boolean;
  nextMonke: number;
}

const simulate = (
  monkes: Map<number, Monke>,
  iterations: number = 20,
  divide: boolean = true,
  hook?: (data: SimulationHook) => void
) => {
  const lcm = Maths.lcm(
    monkes
      .values()
      .map((item) => item.test.value)
      .toArray()
  );
  for (let i = 0; i < iterations; ++i) {
    for (const monke of monkes.values()) {
      //i hope Maps retain insertion order :|
      while (monke.items.length) {
        const item = monke.items.shift()!; //bad
        let nextItem = item;
        const value = monke.operation.value === 'old' ? nextItem : monke.operation.value;
        if (monke.operation.operator === '+') nextItem += value;
        else if (monke.operation.operator === '-') nextItem -= value;
        else if (monke.operation.operator === '*') nextItem *= value;
        else if (monke.operation.operator === '/') nextItem /= value;
        if (divide) nextItem = Maths.floor(nextItem / 3);
        nextItem %= lcm;
        if (nextItem === Infinity) throw new Error(`${item} ${JSON.stringify(monke)} ${nextItem}`);
        const test = nextItem % monke.test.value === 0;
        const nextMonke = test ? monke.test.true : monke.test.false;
        monkes.get(nextMonke)!.items.push(nextItem);
        if (typeof hook !== 'undefined') hook({ id: monke.id, item, nextItem, test, nextMonke });
      }
    }
  }
  debug(1, monkes);
};

const getMonkeBusiness = (iterations: number = 20, divide: boolean = true) => {
  const monkes = parseInput();
  debug(1, monkes);
  const inspectionCounts = new Map<number, number>();
  const increment = (id: number) => inspectionCounts.set(id, (inspectionCounts.get(id) ?? 0) + 1);
  simulate(monkes, iterations, divide, (data: SimulationHook) => {
    debug(2, data);
    increment(data.id);
  });
  debug(1, inspectionCounts);
  const monkeBusiness = inspectionCounts
    .values()
    .toArray()
    .sort((a, b) => b - a)
    .slice(0, 2)
    .reduce((acc, item) => acc * item, 1);
  return monkeBusiness;
};

const part1 = () => {
  console.log('part 1:', getMonkeBusiness());
};

const part2 = () => {
  console.log('part 2:', getMonkeBusiness(10000, false));
};

if (args.part1) part1();
if (args.part2) part2();
