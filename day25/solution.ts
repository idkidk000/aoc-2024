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

const locks = [];
const keys = [];
const rowCount = 7;

for (const section of text.split('\n\n')) {
  const rows = section.split('\n').map((line) => line.split(''));
  const heights = rows[0].map((_, colIx) =>
    rows.reduce((acc, _, rowIx) => (rows[rowIx][colIx] == (rows[0][0] == '#' ? '#' : '.') ? rowIx : acc), 0)
  );
  if (rows[0][0] == '#') {
    locks.push(heights);
  } else {
    keys.push(heights.map((i) => rowCount - i - 2));
  }
}
if (DEBUG > 0) {
  console.debug({ locks });
  console.debug({ keys });
}

let fitCount = 0;
for (const lock of locks) {
  for (const key of keys) {
    const fit = lock.every((li, i) => li + key[i] < rowCount - 1);
    if (DEBUG > 0) console.debug({ lock, key, fit });
    if (fit) fitCount++;
  }
}
console.log('part 1', fitCount);
