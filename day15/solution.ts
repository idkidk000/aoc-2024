#!/usr/bin/env -S deno --allow-read
// deno-lint-ignore-file no-case-declarations

// const DEBUG = true;
const DEBUG = false;
// const FILENAME = 'example.txt';
// const FILENAME = 'example2.txt';
const FILENAME = 'input.txt';

console.log(FILENAME);
const text = await Deno.readTextFile(FILENAME);
// if (DEBUG) console.debug({ text });
const blocks = text.split('\n\n');
// if (DEBUG) console.debug({ blocks });
const moves = blocks[1].split('').filter((char) => char.trim() != '');
// if (DEBUG) console.debug({ moves });

const printMap = (mapData: string[][]) => {
  for (const row of mapData) {
    console.log(row.join(''));
  }
};

const getMapParams = (mapData: string[][]) => {
  const rowCount = mapData.length;
  const colCount = mapData[0].length;
  for (let startRowIx = 0; startRowIx < rowCount; startRowIx++) {
    for (let startColIx = 0; startColIx < colCount; startColIx++) {
      if (mapData[startRowIx][startColIx] === '@') {
        return { rowCount, colCount, startRowIx, startColIx };
      }
    }
  }
  throw new Error('could not find start position');
};

const getOffset = (move: string) => {
  switch (move) {
    case '^':
      return { offsetRow: -1, offsetCol: 0 };
    case '>':
      return { offsetRow: 0, offsetCol: 1 };
    case 'v':
      return { offsetRow: 1, offsetCol: 0 };
    case '<':
      return { offsetRow: 0, offsetCol: -1 };
  }
  throw new Error(`unknown move ${move}`);
};

const part1 = (mapText: string, moves: string[]) => {
  const mapData = mapText
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(''));
  if (DEBUG) printMap(mapData);
  const { rowCount, colCount, startRowIx, startColIx } = getMapParams(mapData);
  let row = startRowIx;
  let col = startColIx;
  if (DEBUG) console.debug({ rowCount, colCount, row, col });
  for (const move of moves) {
    const { offsetRow, offsetCol } = getOffset(move);
    const newRow = row + offsetRow;
    const newCol = col + offsetCol;
    if (DEBUG) console.debug({ row, col, move, offsetRow, offsetCol, newRow, newCol });
    switch (mapData[newRow][newCol]) {
      case '.':
        mapData[row][col] = '.';
        row = newRow;
        col = newCol;
        mapData[row][col] = '@';
        break;
      case '#':
        break;
      case 'O':
        let boxRow = newRow;
        let boxCol = newCol;
        while (mapData[boxRow][boxCol] == 'O') {
          boxRow += offsetRow;
          boxCol += offsetCol;
        }
        if (mapData[boxRow][boxCol] == '.') {
          mapData[row][col] = '.';
          mapData[boxRow][boxCol] = 'O';
          row = newRow;
          col = newCol;
          mapData[row][col] = '@';
        }
        break;
      default:
        throw new Error(`invalid map char ${mapData[newRow][newCol]} at ${newRow},${newCol}`);
    }
    if (DEBUG) printMap(mapData);
  }
  const gpsTotal = mapData.reduce(
    (rowAcc, row, rowIx) => (rowAcc += row.reduce((colAcc, char, colIx) => (colAcc += char == 'O' ? rowIx * 100 + colIx : 0), 0)),
    0
  );
  console.log('part 1:', gpsTotal);
};

part1(blocks[0], moves);
