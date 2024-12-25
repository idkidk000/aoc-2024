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

const locks: number[][] = [];
const keys: number[][] = [];
const rowCount = 7;

for (const section of text.split('\n\n')) {
  const rows = section.split('\n').map((line) => line.split(''));
  const isLock = rows[0][0] == '#';
  const heights = rows[0].map((_, colIx) =>
    rows.reduce((acc, _, rowIx) => (rows[rowIx][colIx] == (isLock ? '#' : '.') ? rowIx : acc), 0)
  );
  (isLock ? locks : keys).push(heights.map((i) => (isLock ? i : rowCount - i - 2)));
}
if (DEBUG > 0) console.debug({ locks, keys });
const fitCount = locks.reduce(
  (acc, lock) => acc + keys.filter((key) => key.every((ki, i) => ki + lock[i] < rowCount - 1)).length,
  0
);
console.log('part 1', fitCount);
