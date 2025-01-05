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

const numericButtons = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [null, '0', 'A'],
];
const directionalButtons = [
  [null, '^', 'A'],
  ['<', 'v', '>'],
];
const buttonMoves: Map<string, string[]> = new Map();
const cacheButtonMoves = () => {
  for (const buttonPad of [numericButtons, directionalButtons]) {
    const rows = buttonPad.length;
    const cols = buttonPad[0].length;
    const buttonCoords = new Map();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const button = buttonPad[r][c];
        if (button !== null) {
          buttonCoords.set(button, [r, c]);
        }
      }
    }
    const buttons = buttonPad.flat().filter((button) => button !== null);
    for (const fromButton of buttons) {
      for (const toButton of buttons) {
        const cacheKey = `${fromButton}${toButton}`;
        if (fromButton == toButton) {
          buttonMoves.set(cacheKey, ['A']);
          continue;
        }
        const testPaths = [[[...buttonCoords.get(fromButton), null]]];
        const paths = [];
        while (testPaths.length > 0) {
          const path = testPaths.pop();
          if (typeof path === 'undefined') continue;
          if (!path) continue;
          const prevPos = path.slice(-1)[0];
          if (!prevPos) continue;
          for (const d of [
            [-1, 0, '^'],
            [0, 1, '>'],
            [1, 0, 'v'],
            [0, -1, '<'],
          ]) {
            const [nr, nc] = [prevPos[0] + d[0], prevPos[1] + d[1]];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            let exists = false;
            for (const p of path) {
              if (p[0] == nr && p[1] == nc) {
                exists = true;
                break;
              }
            }
            if (exists) continue;
            switch (buttonPad[nr][nc]) {
              case null:
                continue;
              case undefined:
                continue;
              case toButton:
                paths.push([...path, [nr, nc, d[2]], [0, 0, 'A']]);
                break;
              default:
                testPaths.push([...path, [nr, nc, d[2]]]);
            }
          }
        }
        const shortestPath = Math.min(...paths.map((p) => p.length));
        buttonMoves.set(
          cacheKey,
          // paths.filter((p) => p.length == shortestPath)
          paths
            .filter((p) => p.length == shortestPath)
            .map((p) =>
              p
                .slice(1)
                .map((c) => c[2])
                .join('')
            )
        );
      }
    }
  }
};
const buttonLengths: Map<string, number> = new Map();
const getButtonLengths = (data: string, depth: number) => {
  //FIXME: this is almost certainly nothing like. need to properly re-read the challenge
  let total = 0;
  for (let d = 1; d <= depth; d++) {
    for (let i = 0; i < data.length; i++) {
      const btnFrom = data[0];
      const btnTo = data[1] ?? 'A';
      //TODO: need to separate if we cache longer sequences
      const cacheKey = `${btnFrom}${btnTo}${d}`;
      if (buttonLengths.has(cacheKey)) {
        total += buttonLengths.get(cacheKey)!;
      } else {
        // FIXME: fairly sure i need to get the actual moves for each depth, not just the length of them
        for (const move of buttonMoves.get(`${btnFrom}${btnTo}`)!){
          
        }
        // const shortest = buttonMoves
        //   .get(`${btnFrom}${btnTo}`)!
        //   .map((m) => m.length)
        //   .reduce((acc, item) => (acc = Math.min(acc, item)), Infinity);
        // buttonLengths.set(cacheKey, shortest);
        total += shortest;
      }
    }
  }
  return total;
};
cacheButtonMoves();
console.log(buttonMoves);
console.log(getButtonLengths(codes[0], 20));
