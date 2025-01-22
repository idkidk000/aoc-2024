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

const findMarker = (data: Array<string>, length: number = 4) => {
  const buffer = new Array<string>();
  const uniques = new Set<string>();
  for (const [i, char] of data.entries()) {
    buffer.push(char);
    if (i > length - 1) {
      buffer.shift(); //very inneficient but it's fine for small amounts of data
      uniques.clear();
      buffer.forEach((item) => uniques.add(item));
    }
    debug(2, { buffer, uniques, i });
    if (uniques.size === length) return i + 1;
  }
  throw new Error('bruh');
};

const part1 = () => {
  const data = Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(''));
  if (data.length > 1) {
    for (const line of data) {
      const result = findMarker(line);
      debug(1, line, result);
    }
  } else {
    const result = findMarker(data[0]);
    console.log('part 1:', result);
  }
};

const part2 = () => {
  const result = findMarker(Deno.readTextFileSync(args.filename).split('\n')[0].split(''), 14);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
