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
const codes = text.split('\n').filter((line) => line.trim());
if (DEBUG > 0) console.debug({ codes });

const numericKeypad = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [null, '0', 'A'],
];
const directionalKeypad = [
  [null, '^', 'A'],
  ['<', 'v', '>'],
];
const keypadMoves: Map<string, string[]> = new Map();
const keypadMoveLengths: Map<string, number> = new Map();

const walkKeypads = () => {
  // populate the keypadMoves map, seed the keypadMoveLengths map at depth 1
  const directions = [
    [-1, 0, '^'],
    [0, 1, '>'],
    [1, 0, 'v'],
    [0, -1, '<'],
  ];
  for (const keypad of [numericKeypad, directionalKeypad]) {
    const keys = keypad.flat().filter((i) => i !== null);
    const rows = keypad.length;
    const cols = keypad[0].length;
    const keyCoords = new Map();
    for (const [r, row] of keypad.entries()) {
      for (const [c, char] of row.entries()) {
        if (char) {
          keyCoords.set(char, [r, c]);
        }
      }
    }
    if (DEBUG > 0) console.debug({ keys, rows, cols, keyCoords });
    for (const keyFrom of keys) {
      for (const keyTo of keys) {
        const cacheKey = `${keyFrom}${keyTo}`;
        if (keyFrom == keyTo) {
          keypadMoves.set(cacheKey, ['A']);
          keypadMoveLengths.set(cacheKey, 1);
          continue;
        }
        const paths = [[[...keyCoords.get(keyFrom)!, null]]];
        const moves = [];
        let shortest = Infinity;
        while (paths.length) {
          // popleft
          const path = paths.shift()!;
          if (DEBUG > 1) console.debug({ path });
          if (path.length > shortest) continue;
          const [r, c, _] = path.at(-1)!;
          for (const d of directions) {
            const nr = r + d[0];
            const nc = c + d[1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (path.some((p) => p[0] == nr && p[1] == nc)) continue;
            switch (keypad[nr][nc]) {
              case null:
                continue;
              case keyTo:
                moves.push([...path.map((p) => p[2]).filter((i) => i !== null), d[2], 'A'].join(''));
                shortest = Math.min(shortest, path.length + 1);
                break;
              default:
                paths.push([...path, [nr, nc, d[2]]]);
            }
          }
        }
        keypadMoves.set(cacheKey, moves);
        keypadMoveLengths.set(cacheKey, shortest);
      }
    }
  }
  if (DEBUG > 1) console.debug({ keypadMoves, keypadMoveLengths });
};

const getMoveLength = (keys: string, depth: number = 0) => {
  const prefixedKeys = `A${keys}`;
  const cacheKey = `${prefixedKeys} ${depth}`;
  // return cached immediately
  if (keypadMoveLengths.has(cacheKey)) return keypadMoveLengths.get(cacheKey)!;
  if (depth == 0) {
    // step through each two chars of prefixedKeys and sum the cached keypadMoveLengths
    const length = Array.from(keys).reduce((acc, _, i) => acc + keypadMoveLengths.get(prefixedKeys.slice(i, i + 2))!, 0);
    keypadMoveLengths.set(cacheKey, length);
    if (DEBUG > 0) console.debug({ prefixedKeys, length, depth });
    return length;
  } else {
    // step through each two chars of prefixedKeys and sum the minimum moves
    const length: number = Array.from(keys).reduce(
      (outerAcc, _, i) =>
        outerAcc +
        keypadMoves
          .get(prefixedKeys.slice(i, i + 2))!
          // recurses through depth
          .reduce((innerAcc: number, move: string) => Math.min(innerAcc, getMoveLength(move, depth - 1)), Infinity),
      0
    );
    keypadMoveLengths.set(cacheKey, length);
    if (DEBUG > 0) console.debug({ prefixedKeys, length, depth });
    return length;
  }
};

const sumCodeComplexities = (depth: number) => {
  return codes.reduce((acc, code) => acc + Number(code.replaceAll(/[^0-9]/g, '')) * getMoveLength(code, depth), 0);
};

// precache all level 0 keypad moves and their lengths
walkKeypads();

const part1 = sumCodeComplexities(2);
console.log('part 1', part1);
const part2 = sumCodeComplexities(25);
console.log('part 2', part2);
