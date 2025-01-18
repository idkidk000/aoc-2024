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

interface SpringRecord {
  data: string;
  checksums: number[];
}

const parseInput = (): SpringRecord[] =>
  input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(/\s+/);
      return {
        data: parts[0],
        checksums: parts[1].split(',').map((token) => Number(token)),
      };
    });

const countArrangements = (record: SpringRecord, cache: Map<string, number> = new Map()): number => {
  // oh neat, the cache worked
  const OPERATIONAL = '.';
  const DAMAGED = '#';
  const INDETERMINATE = '?';
  const cacheKey = record.data + ' ' + record.checksums.join('');
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  debug(1, { cacheKey, record });

  // empty data && empty checksums: previous data was consumed by the previous checksum - return 1
  // empty data && non-empty checksums: impossible - return 0
  if (record.data == '') {
    debug(2, 'no data');
    cache.set(cacheKey, record.checksums.length == 0 ? 1 : 0);
    return cache.get(cacheKey)!;
  }

  // empty checksums && damaged in data: impossible - return 0
  // empty checksums && damaged not in data: all remaining data must be undamaged - return 1
  if (record.checksums.length == 0) {
    debug(2, 'no checksums');
    cache.set(cacheKey, record.data.includes(DAMAGED) ? 0 : 1);
    return cache.get(cacheKey)!;
  }

  // otherwise, recursion time
  let count = 0;

  // indeterminate matches both cases
  if ([OPERATIONAL, INDETERMINATE].includes(record.data[0]))
    count += countArrangements({ data: record.data.slice(1), checksums: record.checksums }, cache);

  if ([DAMAGED, INDETERMINATE].includes(record.data[0])) {
    if (record.checksums[0] > record.data.length) {
      debug(2, 'data too short to satisfy checksum');
    } else if (record.data.slice(0, record.checksums[0]).includes(OPERATIONAL)) {
      debug(2, 'operational in checksummed data');
    } else if (record.checksums[0] == record.data.length || record.data[record.checksums[0]] != DAMAGED) {
      debug(2, 'valid');
      count += countArrangements(
        { data: record.data.slice(record.checksums[0] + 1), checksums: record.checksums.slice(1) },
        cache
      );
    }
  }

  debug(3, { record, count });

  cache.set(cacheKey, count);
  return count;
};

const part1 = () => {
  const records = parseInput();
  debug(2, { records });
  const count = records.map((record) => countArrangements(record)).reduce((acc, item) => acc + item, 0);
  console.log('part 1:', count);
};

const part2 = () => {
  const records = parseInput();
  debug(2, { records });
  const count = records
    .map((record) =>
      countArrangements({
        data: Array(5).fill(record.data).join('?'),
        checksums: Array(5).fill(record.checksums).flat(),
      })
    )
    .reduce((acc, item) => acc + item, 0);
  console.log('part 1:', count);
};

if (PART1) part1();
if (PART2) part2();
