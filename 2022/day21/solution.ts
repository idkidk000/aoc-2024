#!/usr/bin/env -S deno --allow-read
// #region base aoc template
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

type MonkeOperator = '+' | '-' | '/' | '*';
interface MonkeInputs {
  left: string;
  right: string;
  operator: MonkeOperator;
}

const parseInput = () =>
  new Map<string, bigint | MonkeInputs>(
    Deno.readTextFileSync(args.filename)
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.split(': ').map((token) => token.split(' ')))
      .map((tokens) => [
        tokens[0][0],
        tokens[1].length === 1
          ? BigInt(tokens[1][0])
          : {
              left: tokens[1][0],
              right: tokens[1][2],
              operator: tokens[1][1] as MonkeOperator,
            },
      ])
  );

const solve = (monkes: Map<string, bigint | MonkeInputs>, ...monkeIds: Array<string>) => {
  const cache = new Map<string, bigint>();
  const resolve = (monkeId: string): bigint => {
    const value = monkes.get(monkeId)!;
    if (typeof value === 'bigint') return value;
    if (cache.has(monkeId)) return cache.get(monkeId)!;
    const result =
      value.operator === '+'
        ? resolve(value.left) + resolve(value.right)
        : value.operator === '-'
        ? resolve(value.left) - resolve(value.right)
        : value.operator === '/'
        ? resolve(value.left) / resolve(value.right)
        : resolve(value.left) * resolve(value.right);
    cache.set(monkeId, result);
    return result;
  };
  return monkeIds.map((item) => resolve(item));
};

const part1 = () => {
  const [result] = solve(parseInput(), 'root');
  console.log('part 1:', result);

  // 309248622142100
};

const part2 = () => {
  const monkes = parseInput();
  const root = monkes.get('root') as MonkeInputs;
  // right is unaffected by humn. left seems linear
  // unconstrained binary search because ugh maths
  const binarySearch = () => {
    let [low, high] = [0n, 1000n];
    while (low < high) {
      const mid = (low + high) / 2n;
      const testMonkes = new Map(monkes);
      testMonkes.set('humn', mid);
      const [left, right] = solve(testMonkes, root.left, root.right);
      debug(2, { high, low, mid, left, right });
      if (right === left) {
        debug(1, 'found', { high, low, mid, left, right });
        return mid;
      } else if (left > right) low = mid + 1n;
      else if (left < right) high = mid; /* - 1n; */

      if (low >= high && left > right) {
        high *= 2n;
        debug(1, 'expand', { high, low, mid, left, right });
      }
    }
    throw new Error('not found');
  };

  const result = binarySearch();
  console.log('part 2:', result);

  // 3757272361782n
};

if (args.part1) part1();
if (args.part2) part2();
