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
const codes = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => parseInt(line));
if (DEBUG > 1) console.debug({ codes });

const evolve = (value: number) => {
  value ^= value << 6;
  value &= 16777215;
  value ^= value >> 5;
  value &= 16777215;
  value ^= value << 11;
  value &= 16777215;
  return value;
};

const part1 = () => {
  let total = BigInt(0);
  for (let code of codes) {
    for (let i = 0; i < 2000; i++) {
      code = evolve(code);
    }
    total += BigInt(code);
  }
  console.log('part 1:', total);
};

const part2 = () => {
  const totalSequences: Map<string, number> = new Map();
  for (let code of codes) {
    const window = [];
    // per code sequence prices so we can abort if sequence already used
    const codeSequences: Map<string, number> = new Map();
    for (let i = 0; i < 2000; i++) {
      const price = code % 10;
      // no point pruning window on each iteration for only 2000 loops
      window.push(price);
      if (i >= 5) {
        // this is probably the slowest part
        const key = JSON.stringify([
          window[i] - window[i - 1],
          window[i - 1] - window[i - 2],
          window[i - 2] - window[i - 3],
          window[i - 3] - window[i - 4],
        ]);
        // add to codeSequences if not already set
        if (!codeSequences.has(key)) {
          codeSequences.set(key, price);
        }
      }
      code = evolve(code);
    }
    // merge codeSequences into totalSequences
    for (const [key, price] of codeSequences.entries()) {
      totalSequences.set(key, (totalSequences.get(key) ?? 0) + price);
    }
  }
  // select the max value from totalSequences
  const highestSequence = [...totalSequences.entries()].toSorted((a, b) => b[1] - a[1])[0];
  console.log('part 2:', highestSequence);
};

part1();
part2();
