#!/usr/bin/env -S deno --allow-read

const DEBUG = false;
const EXAMPLE = false;

class Coord {
  constructor(public row: number, public col: number) {}
  hash(): number {
    return this.row * 10000000 + this.col;
  }
  validate(maxRow: number, maxCol: number): boolean {
    return this.row >= 0 && this.row < maxRow && this.col >= 0 && this.col < maxCol;
  }
}

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug('text', text);

const mapData = text
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split('').map((char) => parseInt(char)));
const countRows = mapData.length;
const countCols = mapData[0].length;
if (DEBUG) console.debug({ mapData, countRows, countCols });

const trailheads = mapData.reduce<Coord[]>((rowAcc, rowData, rowIx) => {
  const rowMatches = rowData.reduce<Coord[]>((colAcc, value, colIx) => {
    if (value == 0) {
      colAcc.push(new Coord(rowIx, colIx));
    }
    return colAcc;
  }, []);
  return rowAcc.concat(rowMatches);
}, []);
if (DEBUG) console.debug({ trailheads, len: trailheads.length });

let trails: Map<number, Coord>[] = trailheads.map((trailhead) => new Map([[trailhead.hash(), trailhead]]));
if (DEBUG) console.debug({ trails });

const trailsCompleted: Map<number, Coord>[] = [];
for (let nextValue = 1; nextValue < 10; nextValue++) {
  if (DEBUG) console.debug({ nextValue, trails: trails.length, completed: trailsCompleted.length });
  const trailsNext: Map<number, Coord>[] = [];
  for (const trail of trails) {
    // const coord = trail[nextValue - 1];
    const trailValues = [...trail.values()];
    const coord = trailValues.pop()!;
    for (let dirIx = 0; dirIx < 4; dirIx++) {
      const coordNext = new Coord(
        coord.row + (dirIx == 0 ? -1 : dirIx == 2 ? 1 : 0),
        coord.col + (dirIx == 3 ? -1 : dirIx == 1 ? 1 : 0)
      );
      // if (DEBUG) console.debug('test', { coord, dirIx, coordNext });
      if (
        coordNext.validate(countRows, countCols) &&
        !trail.has(coordNext.hash()) &&
        mapData[coordNext.row][coordNext.col] == nextValue
      ) {
        if (DEBUG) console.debug('move', { coord, coordNext, dirIx, nextValue });
        const trailNext = new Map([...trailValues, coord, coordNext].map((i) => [i.hash(), i]));
        if (nextValue == 9) {
          trailsCompleted.push(trailNext);
        } else {
          trailsNext.push(trailNext);
        }
      }
    }
  }
  trails = trailsNext;
}
const trailStartEnd = new Set(
  trailsCompleted.map((trail) => {
    const values = [...trail.values()];
    return JSON.stringify([values[0], values[9]]);
  })
);
if (DEBUG) console.debug({ trailStartEnd });
const totalScores = trailStartEnd.size;
console.log('part 1', totalScores);

const totalRating = trailsCompleted.length;
console.log('part 2', totalRating);