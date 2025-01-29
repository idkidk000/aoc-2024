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

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/))
    .map((tokens) => ({
      snafu: tokens[0],
      decimal: tokens.length > 1 ? Number(tokens[1]) : null,
    }));

const snafuToDecimal = (value: string): number => {
  const tokens = value.split('');
  let output = 0;
  for (const [i, token] of tokens.entries()) {
    const place = tokens.length - i - 1;
    if (token === '2') output += 2 * 5 ** place;
    if (token === '1') output += 1 * 5 ** place;
    if (token === '-') output -= 1 * 5 ** place;
    if (token === '=') output -= 2 * 5 ** place;
  }
  return output;
};

const decimalToSnafu = (value: number): string => {
  let output = '';
  while (value > 0) {
    const remainder = value % 5;
    value = Maths.floor(value / 5);
    output = (remainder === 3 ? '=' : remainder === 4 ? '-' : remainder.toString()) + output;
    if (remainder >= 3) ++value;
  }
  return output;
};

const part1 = () => {
  const decimal = parseInput()
    .map(({ snafu }) => {
      const decimal = snafuToDecimal(snafu);
      debug(1, { snafu, decimal, reversed: decimalToSnafu(decimal) });
      return decimal;
    })
    .reduce((acc, item) => acc + item, 0);
  const result = decimalToSnafu(decimal);
  console.log('part 1:', result);
};

if (args.part1) part1();
