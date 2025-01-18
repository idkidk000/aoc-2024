#!/usr/bin/env -S deno --allow-read

const Maths = Math;

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

interface Race {
  time: number;
  distance: number;
}

const part1 = () => {
  const tokens = input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) =>
      line
        .split(/\s+/)
        .slice(1)
        .map((token) => Number(token))
    );
  const races: Race[] = tokens[0].map((token, i) => ({ time: token, distance: tokens[1][i] }));

  const solutionCounts = races.map((race) => {
    debug(2, { race });
    let solutions = 0; //FIXME: let is a moral failing
    for (let speed = 0; speed <= race.time; ++speed) {
      if (speed * (race.time - speed) > race.distance) ++solutions;
    }
    debug(2, { race, solutions });
    return solutions;
  });

  debug(1, solutionCounts);
  const product = solutionCounts.reduce((acc, item) => acc * item, 1);
  console.log('part 1:', product);
};

const part2 = () => {
  const tokens = input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => Number(line.split(/\s+/).slice(1).join('')));
  const race: Race = { time: tokens[0], distance: tokens[1] };

  const binarySearch = (low: number, high: number, test: (mid: number) => boolean): number => {
    if (low == high) {
      debug(1, { solution: low });
      return low;
    }
    const mid = Maths.floor((low + high) / 2);
    const result = test(mid);
    debug(2, { high, low, mid, result });
    return binarySearch(result ? low : mid + 1, result ? mid : high, test);
  };

  const lowestWin = binarySearch(0, race.time, (mid) => mid * (race.time - mid) > race.distance);
  const highestWin = binarySearch(lowestWin, race.time, (mid) => mid * (race.time - mid) <= race.distance);
  const solutions = highestWin - lowestWin;
  console.log('part 2:', solutions);
};

if (PART1) part1();
if (PART2) part2();
