#!/usr/bin/env -S deno --allow-read

// const DEBUG = true;
const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);

const obstructions = data
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split('').map((char) => char == '#'));
if (DEBUG) console.debug(obstructions);

const countRows = obstructions.length;
const countCols = obstructions[0].length;
const guardStartChar = data.replaceAll('\n', '').indexOf('^');
const guardStart = [Math.floor(guardStartChar / countRows), guardStartChar % countCols];

if (DEBUG) console.debug({ countRows, countCols, guardStartChar, guardStart });

let direction = 0;
let position = [...guardStart];
const uniquePositions: Set<string> = new Set();
while (true) {
  //js doesn't have anything similar to a python tuple, so convert to string so Set can enforce uniqueness
  uniquePositions.add(JSON.stringify(position));
  const nextPosition = [
    position[0] + (direction == 0 ? -1 : direction == 2 ? 1 : 0),
    position[1] + (direction == 3 ? -1 : direction == 1 ? 1 : 0),
  ];
  if (nextPosition[0] >= 0 && nextPosition[0] < countRows && nextPosition[1] >= 0 && nextPosition[1] < countCols) {
    //on map
    if (obstructions[nextPosition[0]][nextPosition[1]]) {
      // turn right
      if (DEBUG) console.debug('obstruction at', nextPosition);
      direction = (direction + 1) % 4;
    } else {
      if (DEBUG) console.debug('move to', nextPosition);
      position = nextPosition;
    }
  } else {
    //off map
    if (DEBUG) console.debug('off map at', nextPosition);
    break;
  }
}
console.log('part 1', uniquePositions.size);

let countInfinite = 0;
uniquePositions.forEach((uniquePosition) => {
  const obstruction = JSON.parse(uniquePosition);
  if (obstruction[0] == guardStart[0] && obstruction[1] == guardStart[1]) return;
  const testObstructions = JSON.parse(JSON.stringify(obstructions));
  testObstructions[obstruction[0]][obstruction[1]] = true;
  const testUniquePositions: Set<string> = new Set();
  let direction = 0;
  let position = [...guardStart];
  while (true) {
    const positionStr = JSON.stringify([...position, direction]);
    if (testUniquePositions.has(positionStr)) {
      if (DEBUG) console.debug(uniquePosition, 'infinite loop at', positionStr);
      countInfinite++;
      break;
    }
    testUniquePositions.add(positionStr);
    const nextPosition = [
      position[0] + (direction == 0 ? -1 : direction == 2 ? 1 : 0),
      position[1] + (direction == 3 ? -1 : direction == 1 ? 1 : 0),
    ];
    if (nextPosition[0] >= 0 && nextPosition[0] < countRows && nextPosition[1] >= 0 && nextPosition[1] < countCols) {
      //on map
      if (testObstructions[nextPosition[0]][nextPosition[1]]) {
        // turn right
        // if (DEBUG) console.debug(uniquePosition,'obstruction at', nextPosition);
        direction = (direction + 1) % 4;
      } else {
        // if (DEBUG) console.debug(uniquePosition,'move to', nextPosition);
        position = nextPosition;
      }
    } else {
      //off map
      if (DEBUG) console.debug(uniquePosition, 'off map at', nextPosition);
      break;
    }
  }
});
console.log('part 2', countInfinite);
