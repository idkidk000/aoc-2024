#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
// const DEBUG = false;

const text = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug('text', text);

const FREE_SPACE = Infinity; //possible deno bug - array of length>=100 containing value -1 .indexOf(-1) returns -1

const diskMap = text
  .split('')
  .filter((char) => char.trim() != '')
  .map((char) => parseInt(char))
  .map((length, ix) => {
    return new Array(length).fill(ix % 2 ? FREE_SPACE : Math.round(ix / 2));
  })
  .flat();
if (DEBUG) console.debug('diskMap', diskMap);

const part1 = (diskMap: number[]) => {
  let packedEndIx = -1;
  for (let fromIx = diskMap.length - 1; fromIx >= 0; fromIx--) {
    const fromFile = diskMap[fromIx];
    if (fromFile == FREE_SPACE) continue;
    const toIx = diskMap.indexOf(FREE_SPACE, packedEndIx + 1);
    if (DEBUG) console.debug({ fromIx, fromFile, toIx });
    if (toIx == FREE_SPACE || toIx > fromIx) break;
    diskMap[toIx] = fromFile;
    diskMap[fromIx] = FREE_SPACE;
    packedEndIx = toIx;
  }
  if (DEBUG) console.debug('diskMap', diskMap);

  const checksum = diskMap.reduce((acc, fileId, ix) => {
    return acc + (fileId == FREE_SPACE ? 0 : fileId * ix);
  }, 0);
  console.log('part 1', checksum);
};

const part2 = (diskMap: number[]) => {
  for (let fromFile = Math.max(...diskMap.filter((i) => i != FREE_SPACE)); fromFile >= 0; fromFile--) {
    const fromIx = diskMap.indexOf(fromFile);
    const fromLength = diskMap.lastIndexOf(fromFile) - fromIx + 1;

    let toLength = 0;
    let toIx = FREE_SPACE;
    for (let testIx = diskMap.indexOf(FREE_SPACE); testIx < fromIx; testIx++) {
      switch (diskMap[testIx]) {
        case FREE_SPACE:
          toLength++;
          if (toIx == FREE_SPACE) toIx = testIx;
          break;
        default:
          toLength = 0;
          toIx = FREE_SPACE;
      }
      if (toLength == fromLength) {
        diskMap.fill(fromFile, toIx, toIx + fromLength);
        diskMap.fill(FREE_SPACE, fromIx, fromIx + fromLength);
        if (DEBUG) console.debug({ fromFile, fromIx, fromLength, toIx });
        break;
      }
    }
  }
  if (DEBUG) console.debug('diskMap', diskMap);
  const checksum = diskMap.reduce((acc, fileId, ix) => {
    return acc + (fileId == FREE_SPACE ? 0 : fileId * ix);
  }, 0);
  console.log('part 2', checksum);
};

// part1([...diskMap]);
part2([...diskMap]);
