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

const parseInput = () => {
  interface Mapping {
    from: number;
    to: number;
    offset: number;
  }

  const sections = input.split('\n\n');

  const seeds = sections[0]
    .split(/:\s+/)[1]
    .split(/\s+/)
    .map((token) => Number(token));

  const conversions: Map<string, Mapping[]> = new Map(
    sections.slice(1).map((section) => [
      section.split(' ')[0],
      section
        .split('\n')
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const tokens = line.split(/\s+/);
          return {
            // dest from, source from, count
            from: Number(tokens[1]),
            to: Number(tokens[1]) + Number(tokens[2]) - 1,
            offset: Number(tokens[0]) - Number(tokens[1]),
          };
        }),
    ])
  );

  return { seeds, conversions };
};

const part1 = () => {
  const { seeds, conversions } = parseInput();

  const convert = (keys: string[], value: number): number => {
    if (keys.length == 0) return value;
    const key = keys.shift()!;
    const mapping = conversions.get(key)!.find((i) => i.from <= value && value <= i.to);
    const result = typeof mapping != 'undefined' ? value + mapping.offset : value;
    debug(2, { key, value, result });
    return convert(keys, result);
  };

  const locations = seeds.map((seed) => convert([...conversions.keys()], seed));
  debug(1, { locations });
  const minLocation = Maths.min(...locations);

  console.log('part 1:', minLocation);
};

const part2 = () => {
  const { seeds, conversions } = parseInput();

  interface Range {
    from: number;
    to: number;
  }

  const convert = (keys: string[], ranges: Range[]): Range[] => {
    if (keys.length == 0) return ranges;
    const key = keys.shift()!;
    debug(1, { key, ranges });
    const queue = [...ranges];
    const results: Range[] = [];

    while (queue.length) {
      const range = queue.shift()!;
      // find the first mapping which at least partially covers our range
      const mapping = conversions.get(key)!.find((m) => m.from <= range.to && m.to >= range.from);
      if (typeof mapping != 'undefined') {
        const mapped: Range = {
          from: Maths.max(range.from, mapping.from) + mapping.offset,
          to: Maths.min(range.to, mapping.to) + mapping.offset,
        };
        const unmapped: Range[] = [];
        // push unmapped back to the queue
        if (mapping.from > range.from) unmapped.push({ from: range.from, to: mapping.from - 1 });
        if (mapping.to < range.to) unmapped.push({ from: mapping.to + 1, to: range.to });
        debug(2, { range, mapping, mapped, unmapped });
        results.push(mapped);
        queue.push(...unmapped);
      } else {
        debug(2, { range, mapping });
        results.push(range);
      }
    }

    const inputCount = ranges.map((r) => r.to - r.from + 1).reduce((acc, item) => acc + item, 0);
    const outputCount = results.map((r) => r.to - r.from + 1).reduce((acc, item) => acc + item, 0);
    debug(1, { key, ranges, results, inputCount, outputCount });
    if (inputCount != outputCount) throw new Error('bruh');

    return convert(keys, results);
  };

  const locations = seeds
    .filter((_, i) => i % 2 == 0)
    .map((seed, i) => [seed, seed + seeds[i * 2 + 1] - 1])
    .flatMap(([from, to]) => convert([...conversions.keys()], [{ from, to }]));

  debug(1, { locations });
  const minLocation = Maths.min(...locations.map((location) => location.from));
  console.log('part 2:', minLocation);
};

if (PART1) part1();
if (PART2) part2();
