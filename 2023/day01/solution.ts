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

const part1 = () => {
  const digits = input
    .replaceAll(/[^1-9\n]/g, '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(''));
  debug(1, { digits });
  const total = digits.reduce((acc, item) => acc + Number(`${item[0]}${item.slice(-1)[0]}`), 0);
  console.log('part 1:', total);
};

const part2 = () => {
  const lookup = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
  };
  const digits = input
    .replaceAll(new RegExp(Object.keys(lookup).join('|'), 'g'), (matched: string) => lookup[matched as keyof typeof lookup])
    .replaceAll(/[^1-9\n]/g, '')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(''));
  debug(1, { digits });
  const total = digits.reduce((acc, item) => acc + Number(`${item[0]}${item.slice(-1)[0]}`), 0);
  console.log('part 2:', total);
};

if (PART1) part1();
if (PART2) part2();
