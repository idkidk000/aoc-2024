#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item == '-d' ? 1 : item == '-d2' ? 2 : item == '-d3' ? 3 : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });
const D4 = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

const text = await Deno.readTextFile(FILENAME);
if (DEBUG > 1) console.debug({ text });

const mapData = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split(''));
if (DEBUG > 1) console.debug({ mapData });

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

const getMapTimes = (mapData: string[][]) => {
  // find the single path and store times to each visited cell
  const mapTimes: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => -1));
  let [cr, cc] = startAt;
  mapTimes[cr][cc] = 0;
  const [er, ec] = endAt;
  while (cr != er || cc != ec) {
    for (const d of D4) {
      const [nr, nc] = [cr + d[0], cc + d[1]];
      // if (DEBUG > 1) console.log({ cr, cc, d, nr, nc });
      if (mapData[nr][nc] == '#') continue;
      if (mapTimes[nr][nc] != -1) continue;
      mapTimes[nr][nc] = mapTimes[cr][cc] + 1;
      [cr, cc] = [nr, nc];
      break;
    }
  }
  return mapTimes;
};
if (DEBUG) printMap(mapData);
const { rows, cols, startAt, endAt } = getMapParams(mapData);
if (DEBUG) console.debug({ rows, cols, startAt, endAt });
const mapTimes = getMapTimes(mapData);
// if (DEBUG) printMap(mapTimes);

const part1 = () => {
  let count = 0;
  // loop over all rows and cols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mapTimes[r][c] == -1) continue;
      const origTime = mapTimes[r][c];
      // loop over all possible shortcut offsets
      for (const d of [
        [-2, 0],
        [-1, 1],
        [0, 2],
        [1, 1],
        [2, 0],
        [1, -1],
        [0, -2],
        [-1, -1],
      ]) {
        const [nr, nc] = [r + d[0], c + d[1]];
        // exclude oob and wall
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const time = mapTimes[nr][nc];
        if (time == -1) continue;
        // add to count
        const saving = time - origTime - 2;
        if (saving < 100) continue;
        count++;
      }
    }
  }
  console.log('part 1:', count);
};

const part2 = () => {
  //precomupte the offsets
  const maxMoves = 20;
  const offsets = [];
  for (let r = 0 - maxMoves; r <= maxMoves; r++) {
    for (let c = 0 - maxMoves; c <= maxMoves; c++) {
      const moves = Math.abs(r) + Math.abs(c);
      if (moves > maxMoves || moves < 2) continue;
      offsets.push([r, c, moves]);
    }
  }
  if (DEBUG > 1) console.debug({ offsets });

  const shortcutTimes = new Map();
  let countAll = 0;
  let count100 = 0;
  // loop over all rows and cols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mapTimes[r][c] == -1) continue;
      const origTime = mapTimes[r][c];
      for (const [or, oc, moves] of offsets) {
        const [nr, nc] = [r + or, c + oc];
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const time = mapTimes[nr][nc];
        if (time == -1) continue;
        const saving = time - origTime - moves;
        if (saving < 0) continue;
        countAll++;
        if (saving >= 100) count100++;
        shortcutTimes.set(saving, (shortcutTimes.get(saving) ?? 0) + 1);
      }
    }
  }
  if (DEBUG) {
    const sortedShortcutTimes = [...shortcutTimes].sort((a, b) => a[0] - b[0]);
    console.debug({ sortedShortcutTimes });
  }
  // .sort((a, b) => Number(a[0]) - Number(b[0]));
  console.log('part 2:', { count100, countAll });
};

part1();
part2();
