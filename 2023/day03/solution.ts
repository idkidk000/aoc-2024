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

const parseInput = () => {
  const grid = input.split('\n').filter((line) => line.trim());
  const rows = grid.length;
  const cols = grid[0].length;
  return { grid, rows, cols };
};

const part1 = () => {
  const { grid, rows, cols } = parseInput();
  const partRegex = /[0-9]+/g;
  const gearRegex = /[^0-9.]/;
  const partNumbers: number[] = [];
  for (const [rowId, row] of grid.entries()) {
    debug(1, { row, rowId });
    for (const match of row.matchAll(partRegex)) {
      const startIx = match.index;
      const endIx = match.index + match[0].length;
      const partNumber = Number(match[0]);
      const checkStartIx = startIx > 0 ? startIx - 1 : startIx;
      const checkEndIx = endIx < cols ? endIx + 1 : endIx;
      const surroundings: Map<string, string> = new Map();
      if (rowId > 0) surroundings.set('above', grid[rowId - 1].substring(checkStartIx, checkEndIx));
      if (rowId < rows - 1) surroundings.set('below', grid[rowId + 1].substring(checkStartIx, checkEndIx));
      if (checkStartIx < startIx) surroundings.set('left', row.substring(checkStartIx, startIx));
      if (checkEndIx > endIx) surroundings.set('right', row.substring(endIx, checkEndIx));
      const gearMatch = gearRegex.test(Array.from(surroundings.values()).join(''));
      debug(1, { startIx, endIx, partNumber, checkStartIx, checkEndIx, surroundings, gearMatch });
      if (gearMatch) partNumbers.push(partNumber);
    }
  }
  debug(1, partNumbers);

  const sum = partNumbers.reduce((acc, item) => acc + item, 0);
  console.log('part 1', sum);
};

const part2 = () => {
  interface Gear {
    r: number;
    c: number;
  }

  const { grid, rows, cols } = parseInput();
  const partRegex = /[0-9]+/g;
  const gearRegex = /\*/g;

  const findGears = (rowId: number, colIdStart: number, colIdEnd: number) => {
    const result: Gear[] = [];
    if (0 <= rowId && rowId < rows && colIdStart < colIdEnd) {
      for (const gearMatch of grid[rowId].substring(colIdStart, colIdEnd).matchAll(gearRegex)) {
        result.push({ r: rowId - 1, c: colIdStart + gearMatch.index });
      }
    }
    return result;
  };

  const gears: Map<string, number[]> = new Map();
  for (const [rowId, row] of grid.entries()) {
    debug(1, { row, rowId });
    for (const match of row.matchAll(partRegex)) {
      const startIx = match.index;
      const endIx = match.index + match[0].length;
      const partNumber = Number(match[0]);
      const checkStartIx = startIx > 0 ? startIx - 1 : startIx;
      const checkEndIx = endIx < cols ? endIx + 1 : endIx;
      const surroundingGears: Gear[] = [];
      surroundingGears.push(
        ...findGears(rowId - 1, checkStartIx, checkEndIx),
        ...findGears(rowId + 1, checkStartIx, checkEndIx),
        ...findGears(rowId, checkStartIx, startIx),
        ...findGears(rowId, endIx, checkEndIx)
      );
      debug(1, { startIx, endIx, partNumber, checkStartIx, checkEndIx, surroundingGears });
      if (surroundingGears.length == 1) {
        // ugh
        const gearUnique = JSON.stringify(surroundingGears[0]);
        gears.set(gearUnique, [...(gears.get(gearUnique) ?? []), partNumber]);
      }
    }
  }
  debug(1, gears);

  const sum = Array.from(gears.values())
    .filter((v) => v.length == 2)
    .reduce((acc, [left, right]) => acc + left * right, 0);
  console.log('part 2:', sum);
};

if (PART1) part1();
if (PART2) part2();
