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

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim());

const part1 = () => {
  const input = parseInput();
  const width = input[0].length;
  let gamma = 0;
  for (let i = 0; i < width; ++i)
    gamma |= input.filter((item) => item[i] === '1').length > input.length / 2 ? 1 << (width - i - 1) : 0;
  const epsilon = ((1 << width) - 1) ^ gamma;
  debug(1, { width, gamma, epsilon });
  console.log('part 1:', gamma * epsilon);
};

const part2 = () => {
  const input = parseInput();
  const width = input[0].length;
  const getReading = (oxygen: boolean): number => {
    let filteredInput = input;
    for (let i = 0; i < width && filteredInput.length > 1; ++i) {
      const ones = filteredInput.filter((value) => value[i] === '1').length;
      const digit = ones < filteredInput.length / 2 ? (oxygen ? '0' : '1') : oxygen ? '1' : '0';
      filteredInput = filteredInput.filter((value) => value[i] === digit);
    }
    return parseInt(filteredInput[0], 2);
  };
  const o2 = getReading(true);
  const co2 = getReading(false);
  debug(1, { o2, co2 });
  console.log('part 2:', o2 * co2);
};

if (args.part1) part1();
if (args.part2) part2();
