#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
// const DEBUG = false;

class Coord {
  constructor(public row: number, public col: number) {}
  hash(): number {
    return this.row * 10000000 + this.col;
  }
}

const text = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(text);

const mapData = text
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split(''));
const countRows = mapData.length;
const countCols = mapData[0].length;
if (DEBUG) console.debug({ mapData, countRows, countCols });

// const antennas: { frequency: string; position: number[] }[] = [];
const frequencies: Record<string, { antennas: Map<number, Coord>; antinodes: Map<number, Coord> }> = {};
for (let ixRow = 0; ixRow < countRows; ixRow++) {
  for (let ixCol = 0; ixCol < countCols; ixCol++) {
    const frequency = mapData[ixRow][ixCol];
    if (frequency == '.') continue;
    const antenna = new Coord(ixRow, ixCol);
    if (frequencies[frequency]) {
      frequencies[frequency].antennas.set(antenna.hash(), antenna);
    } else {
      frequencies[frequency] = {
        antennas: new Map([[antenna.hash(), antenna]]),
        antinodes: new Map(),
      };
    }
  }
}
if (DEBUG) console.debug({ frequencies });

Object.entries(frequencies).forEach(([frequency, props]) => {
  if (DEBUG) console.debug({ frequency, props });
  for (const [hash0, antenna0] of props.antennas) {
    for (const [hash1, antenna1] of props.antennas) {
      if (hash0 == hash1) continue;
      for (const antinode of [
        new Coord(antenna0.row + antenna0.row - antenna1.row, antenna0.col + antenna0.col - antenna1.col),
        new Coord(antenna1.row + antenna1.row - antenna0.row, antenna1.col + antenna1.col - antenna0.col),
      ]) {
        if (antinode.row >= 0 && antinode.row < countRows && antinode.col >= 0 && antinode.col < countCols) {
          props.antinodes.set(antinode.hash(), antinode);
        }
      }
    }
  }
});
if (DEBUG) console.debug({ frequencies });

const allAntinodes = Object.entries(frequencies).reduce((acc, [_, props]) => {
  for (const [hash, antinode] of props.antinodes) {
    acc.set(hash, antinode);
  }
  return acc;
}, new Map<number, Coord>());
if (DEBUG) console.debug({ allAntinodes, countRows, countCols });
console.log('part 1', allAntinodes.size);

Object.entries(frequencies).forEach(([frequency, props]) => {
  if (DEBUG) console.debug({ frequency, props });
  props.antinodes.clear();
  for (const [hash0, antenna0] of props.antennas) {
    for (const [hash1, antenna1] of props.antennas) {
      if (hash0 == hash1) continue;
      const baseOffset = new Coord(antenna1.row - antenna0.row, antenna1.col - antenna0.col);
      for (let i = countRows * -1; i < countRows; i++) {
        const antinode = new Coord(antenna0.row + baseOffset.row * i, antenna0.col + baseOffset.col * i);
        if (antinode.row >= 0 && antinode.row < countRows && antinode.col >= 0 && antinode.col < countCols) {
          props.antinodes.set(antinode.hash(), antinode);
        }
      }
    }
  }
});
if (DEBUG) console.debug({ frequencies });

const allAntinodes2 = Object.entries(frequencies).reduce((acc, [_, props]) => {
  for (const [hash, antinode] of props.antinodes) {
    acc.set(hash, antinode);
  }
  return acc;
}, new Map<number, Coord>());
if (DEBUG) console.debug({ allAntinodes2, countRows, countCols });
console.log('part 2', allAntinodes2.size);
