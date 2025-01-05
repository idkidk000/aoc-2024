#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
// const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);
const grid = data.split('\n').map((line) => line.split(''));
if (DEBUG) console.debug(grid);

const count_rows = grid.length;
const count_cols = grid[0].length;

let total1 = 0;
for (let ixRow = 0; ixRow < count_rows; ixRow++) {
  for (let ixCol = 0; ixCol < count_cols; ixCol++) {
    // if (DEBUG) console.debug('check', { ixRow, ixCol });
    for (let ixDir = 0; ixDir < 8; ixDir++) {
      const chars = [];
      for (let ixChar = 0; ixChar < 4; ixChar++) {
        const row_mult = [7, 0, 1].includes(ixDir) ? -1 : [3, 4, 5].includes(ixDir) ? 1 : 0;
        const col_mult = [5, 6, 7].includes(ixDir) ? -1 : [1, 2, 3].includes(ixDir) ? 1 : 0;
        const char_row = ixRow + ixChar * row_mult;
        const char_col = ixCol + ixChar * col_mult;
        // if (DEBUG) console.debug('check', { ixRow, ixCol, ixDir, ixChar, row_mult, col_mult, char_row, char_col });
        if (char_row >= 0 && char_row < count_rows && char_col >= 0 && char_col < count_cols) {
          chars.push(grid[char_row][char_col]);
        }
      }
      if (chars.join('') == 'XMAS') {
        if (DEBUG) console.debug('found', { ixRow, ixCol, ixDir });
        total1++;
      }
    }
  }
}
console.log('part 1', total1);

let total2 = 0;
for (let ixRow = 1; ixRow < count_rows - 1; ixRow++) {
  for (let ixCol = 1; ixCol < count_cols - 1; ixCol++) {
    if (grid[ixRow][ixCol] != 'A') continue;
    // if (DEBUG) console.debug('check', { ixRow, ixCol });
    const pairs = [
      [grid[ixRow - 1][ixCol - 1], grid[ixRow + 1][ixCol + 1]],
      [grid[ixRow - 1][ixCol + 1], grid[ixRow + 1][ixCol - 1]],
    ];
    if (pairs.every((pair) => ['MS', 'SM'].includes(pair.join('')))) {
      if (DEBUG) console.debug('found', { ixRow, ixCol });
      total2++;
    }
  }
}
console.log('part 2', total2);
