#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item == '-d' ? 1 : item == '-d2' ? 2 : item == '-d3' ? 3 : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

const text = await Deno.readTextFile(FILENAME);
// if (DEBUG > 1) console.debug({ text });
const sections = text.split('\n\n');
const components = sections[0].split(', ');
if (DEBUG > 1) console.debug({ components });
const targets = sections[1].split('\n').filter((line) => line.trim());
if (DEBUG > 1) console.debug({ targets });
const maxComponentLen = Math.max(...components.map((i) => i.length));

const solutionCache: Map<string, bigint> = new Map();
const countSolutions = (target: string) => {
  if (solutionCache.has(target)) {
    return solutionCache.get(target)!;
  }
  let count = BigInt(0);
  for (let i = 1; i <= Math.min(maxComponentLen, target.length); i++) {
    const first = target.slice(0, i);
    const second = target.slice(i);
    const firstIsComponent = components.includes(first);
    if (DEBUG > 1) console.debug({ i, first, second, firstIsComponent });
    if (firstIsComponent) {
      if (second == '') {
        count++;
      } else {
        count += countSolutions(second);
      }
    }
  }
  solutionCache.set(target, count);
  return count;
};

const solve = () => {
  let totalSolvable = 0,
    totalSolutions = BigInt(0);
  for (const target of targets) {
    if (DEBUG > 0) {
      console.debug(target);
    }
    const targetSolutions = countSolutions(target);
    if (targetSolutions > 0) totalSolvable++;
    totalSolutions += targetSolutions;
  }
  console.log('part 1:', totalSolvable);
  console.log('part 2:', totalSolutions);
};

solve();
