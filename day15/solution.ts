#!/usr/bin/env -S deno --allow-read
// deno-lint-ignore-file no-case-declarations

// const DEBUG = true;
const DEBUG = false;
// const FILENAME = 'example.txt';
// const FILENAME = 'example2.txt';
// const FILENAME = 'example3.txt';
// const FILENAME = 'example4.txt';
const FILENAME = 'input.txt';

// console.log(FILENAME);
const text = await Deno.readTextFile(FILENAME);
// if (DEBUG) console.debug({ text });
const blocks = text.split('\n\n');
// if (DEBUG) console.debug({ blocks });
const moves = blocks[1].split('').filter((char) => char.trim() != '');
// if (DEBUG) console.debug({ moves });

const printMap = (mapData: string[][], rowFrom: number = 0, rowTo: number = -1, colFrom: number = 0, colTo: number = -1) => {
  let rowIx = rowFrom;
  for (const row of mapData.slice(rowFrom, rowTo == -1 ? undefined : rowTo)) {
    const rowIxStr = String(rowIx).padStart(3, '0');
    console.log(`${rowIxStr} ${row.slice(colFrom, colTo == -1 ? undefined : colTo).join('')}`);
    rowIx++;
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

const pushBoxCoords = (boxCoords: number[][], newCoords: number[][]) => {
  //TODO: this is very inneficient. map of a coord class with a hash function would be faster
  for (const newCoord of newCoords) {
    let duplicate = false;
    for (const boxCoord of boxCoords) {
      if (boxCoord[0] == newCoord[0] && boxCoord[1] == newCoord[1]) {
        duplicate = true;
        break;
      }
    }
    if (!duplicate) {
      boxCoords.push(newCoord);
    }
  }
  return boxCoords;
};

const walkVertBoxes = (
  mapData: string[][],
  row: number,
  col: number,
  offset: number
): { boxCoords: number[][]; success: boolean } => {
  // recursive horrors
  // i think duplication is unavoidable using this approach
  let boxCoords: number[][] = [];
  let success = true;
  switch (mapData[row][col]) {
    case '#':
      success = false;
      break;
    case '[':
      const { boxCoords: llBoxCoords, success: llSuccess } = walkVertBoxes(mapData, row + offset, col, offset);
      const { boxCoords: lrBoxCoords, success: lrSuccess } = walkVertBoxes(mapData, row + offset, col + 1, offset);
      success = success && llSuccess && lrSuccess;
      boxCoords = pushBoxCoords(boxCoords, [[row, col], [row, col + 1], ...llBoxCoords, ...lrBoxCoords]);
      break;
    case ']':
      const { boxCoords: rlBoxCoords, success: rlSuccess } = walkVertBoxes(mapData, row + offset, col - 1, offset);
      const { boxCoords: rrBoxCoords, success: rrSuccess } = walkVertBoxes(mapData, row + offset, col, offset);
      success = success && rlSuccess && rrSuccess;
      boxCoords = pushBoxCoords(boxCoords, [[row, col - 1], [row, col], ...rlBoxCoords, ...rrBoxCoords]);
      break;
    case '.':
      success = true;
      break;
  }
  for (const outer of boxCoords) {
    let count = 0;
    for (const inner of boxCoords) {
      if (inner[0] == outer[0] && inner[1] == outer[1]) count++;
    }
    if (count > 1) throw new Error(`duplicate boxCoords ${outer} count=${count}`);
  }
  return { boxCoords, success };
};

const hashMap = (mapData: string[][]): number => {
  // for comparing with the python implementation to see where things diverge
  const MOD_L = Math.pow(2, 31) - 1; // a large prime
  const MOD_S = Math.pow(2, 17) - 1; // a smaller prime
  return mapData.reduce((rowAcc, row, rowIx) => {
    const rowVal = row.reduce((charAcc, char, charIx) => {
      const charVal = Math.pow(charIx + 1, char == '#' ? 3 : char == '.' ? 5 : char == '[' ? 7 : char == ']' ? 11 : 13) % MOD_S;
      // console.debug('rowIx=', rowIx, 'charIx=', charIx, 'char=', char, 'charVal=', charVal);
      return (charAcc * charVal) % MOD_S;
    }, 1);
    // console.debug('rowIx=', rowIx, 'rowVal=', rowVal);
    return (rowAcc * rowVal) % MOD_S;
  }, 1);
};

const part2 = (mapText: string, moves: string[]) => {
  const mapData = mapText
    .split('\n')
    .filter((line) => line.trim())
    .map((line) =>
      line
        .split('')
        .map((char) => {
          switch (char) {
            case '@':
              return ['@', '.'];
            case 'O':
              return ['[', ']'];
            default:
              return [char, char];
          }
        })
        .flat(1)
    );
  if (DEBUG) printMap(mapData);
  const { rowCount, colCount, startRowIx, startColIx } = getMapParams(mapData);
  let row = startRowIx;
  let col = startColIx;
  if (DEBUG) console.debug({ rowCount, colCount, row, col });
  let moveId = 0;
  for (const move of moves) {
    moveId++;
    const { offsetRow, offsetCol } = getOffset(move);
    const newRow = row + offsetRow;
    const newCol = col + offsetCol;
    if (DEBUG) console.debug({ moveId, row, col, move, offsetRow, offsetCol, newRow, newCol });
    const charAt = mapData[newRow][newCol];
    switch (charAt) {
      case '.':
        mapData[row][col] = '.';
        row = newRow;
        col = newCol;
        mapData[row][col] = '@';
        break;
      case '#':
        break;
      case '[':
      case ']':
        if (['<', '>'].includes(move)) {
          // left/right
          let boxCol = newCol;
          // follow offsetCol until we find a non-box
          while (['[', ']'].includes(mapData[newRow][boxCol])) {
            boxCol += offsetCol;
          }
          if (DEBUG) console.debug('move left/right', { col, newCol, boxCol });
          // if the non-box is empty
          if (mapData[newRow][boxCol] == '.') {
            // loop over newCol to boxCol and rewrite chars
            for (let i = 1; i < Math.abs(newCol - boxCol) + 1; i++) {
              // map i back to the correct column
              const updateCol = newCol + i * offsetCol;
              const updateChar = i % 2 == (offsetCol > 0 ? 1 : 0) ? '[' : ']';
              if (DEBUG) console.debug('move left/right', { i, offsetCol, newCol, updateCol, updateChar });
              // set char based on i mod 2
              mapData[newRow][updateCol] = updateChar;
            }
            // move
            mapData[row][col] = '.';
            row = newRow;
            col = newCol;
            mapData[row][col] = '@';
          }
        } else {
          // up down requires a recursive function
          // return an array of coords as a number[] so sort works if we need it
          const { boxCoords, success } = walkVertBoxes(mapData, newRow, newCol, offsetRow);
          if (DEBUG) console.debug({ success, boxCoords });
          if (success) {
            if (boxCoords.length == 0) throw new Error('boxCoords cannot be empty');
            // TODO: may need to sort depending on the walkVertBoxes function. would nbeed to order based ofn offsetRow
            for (const [boxRow, boxCol] of boxCoords.toReversed()) {
              if (DEBUG) console.debug({ boxRow, boxCol });
              mapData[boxRow + offsetRow][boxCol] = mapData[boxRow][boxCol];
              mapData[boxRow][boxCol] = '.';
            }
            // move
            mapData[row][col] = '.';
            row = newRow;
            col = newCol;
            mapData[row][col] = '@';
          }
        }

        break;
      default:
        throw new Error(`invalid map char ${charAt} at ${newRow},${newCol}`);
    }
    if (DEBUG) printMap(mapData);
    // if (moveId > 15) break;
    // console.log(moveId);
    // printMap(mapData);
    // console.log(`${moveId}: ${hashMap(mapData)}`);
    // break;
    // Deno.writeTextFile(`maps/ts_${String(moveId).padStart(5, '0')}.txt`, mapData.flat().join(''));
    if ([14087, 14088, 14089].includes(moveId)) {
      console.log({ moveId, row, col, move });
      printMap(mapData, 30, 40, 0, 30);
    }
  }
  const gpsTotal = mapData.reduce(
    (rowAcc, row, rowIx) => (rowAcc += row.reduce((colAcc, char, colIx) => (colAcc += char == '[' ? rowIx * 100 + colIx : 0), 0)),
    0
  );
  // console.log('part 2:', gpsTotal);
};

// part1(blocks[0], moves);
part2(blocks[0], moves);
