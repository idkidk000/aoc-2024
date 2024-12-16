#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => item == '-d' || acc, false);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

const text = await Deno.readTextFile(FILENAME);
// if (DEBUG) console.debug({ text });

const mapData = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split(''));
// if (DEBUG) console.debug({ mapData });

const getMapParams = (mapData: string[][]) => {
  const rows = mapData.length;
  const cols = mapData[0].length;
  let startAt, endAt;
  for (let rowIx = 0; rowIx < rows; rowIx++) {
    for (let colIx = 0; colIx < cols; colIx++) {
      const charAt = mapData[rowIx][colIx];
      switch (charAt) {
        case 'S':
          startAt = [rowIx, colIx];
          break;
        case 'E':
          endAt = [rowIx, colIx];
          break;
      }
    }
  }
  if (typeof startAt === 'undefined' || typeof endAt === 'undefined') {
    throw new Error(`could not find start and end pos startAt=${startAt}, endAt=${endAt}`);
  }
  return { rows, cols, startAt, endAt };
};

const printMap = (mapData: string[][]) => {
  for (let rowIx = 0; rowIx < mapData.length; rowIx++) {
    console.log(`${String(rowIx).padStart(3, ' ')}:  ${mapData[rowIx].join('')}`);
  }
};

if (DEBUG) printMap(mapData);
const { rows, cols, startAt, endAt } = getMapParams(mapData);
if (DEBUG) console.debug({ rows, cols, startAt, endAt });
