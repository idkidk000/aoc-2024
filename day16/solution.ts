#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => item == '-d' || acc, false);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

class Tuple {
  private _hash: string;
  constructor(public value: number[]) {
    this._hash = JSON.stringify(this.value);
  }
  hash() {
    return this._hash;
  }
}

class Path {
  constructor(
    public done: boolean,
    public pos: Tuple,
    public hist: Map<string, Tuple>,
    public dir: number,
    public cost: number
  ) {}
}

const text = await Deno.readTextFile(FILENAME);
// if (DEBUG) console.debug({ text });

const mapData = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split(''));
// if (DEBUG) console.debug({ mapData });

const getMapParams = (mapData: string[][]) => {
  const rows = mapData.length;
  const cols = mapData[0].length;
  let startAt, endAt;
  for (let rowIx = 0; rowIx < rows; rowIx++) {
    for (let colIx = 0; colIx < cols; colIx++) {
      const charAt = mapData[rowIx][colIx];
      switch (charAt) {
        case 'S':
          startAt = new Tuple([rowIx, colIx]);
          break;
        case 'E':
          endAt = new Tuple([rowIx, colIx]);
          break;
      }
    }
  }
  if (typeof startAt === 'undefined' || typeof endAt === 'undefined') {
    throw new Error(`could not find start and end pos startAt=${startAt}, endAt=${endAt}`);
  }
  return { rows, cols, startAt, endAt };
};

const printMap = (mapData: string[][]) => {
  for (let rowIx = 0; rowIx < mapData.length; rowIx++) {
    console.log(`${String(rowIx).padStart(3, ' ')}:  ${mapData[rowIx].join('')}`);
  }
};

const solve = (mapData: string[][]) => {
  const { rows, cols, startAt, endAt } = getMapParams(mapData);
  if (DEBUG) {
    printMap(mapData);
    console.debug({ rows, cols, startAt, endAt });
  }
  let paths = [new Path(false, startAt, new Map([[startAt.hash(), startAt]]), 1, 0)];
  //TODO: needs typing
  const posCosts = new Map();
  for (let i = 0; i < rows * cols; i++) {
    const nextPaths = [];
    for (const path of paths) {
      if (path.done) {
        nextPaths.push(path);
        continue;
      }
      for (let j = -1; j < 2; j++) {
        // rotate and move
        const dir = (((path.dir + j) % 4) + 4) % 4;
        const cost = 1 + (j == 0 ? 0 : 1000);
        const nextPos = new Tuple([
          path.pos.value[0] + (dir == 0 ? -1 : dir == 2 ? 1 : 0),
          path.pos.value[1] + (dir == 3 ? -1 : dir == 1 ? 1 : 0),
        ]);
        if (DEBUG) console.debug({ i, j, path, dir, cost, nextPos });

        // discard on loop
        if (path.hist.has(nextPos.hash())) continue;

        // discard on wall
        const charAt = mapData[nextPos.value[0]][nextPos.value[1]];
        if (charAt == '#') continue;

        // discard on more expensive
        const posCost = posCosts.get(nextPos.hash());
        if (typeof posCost !== 'undefined') {
          if (posCost > path.cost + cost) {
            posCosts.set(nextPos.hash(), path.cost + cost);
            // TODO: reduce optimisation for part 2 since we need more paths to complete
          } else if (posCost <= path.cost + cost + 3001) {
            break;
          }
        } else {
          posCosts.set(nextPos.hash(), path.cost + cost);
        }

        // create a new path
        const nextPath = new Path(
          charAt == 'E',
          nextPos,
          new Map([...path.hist, [nextPos.hash(), nextPos]]),
          dir,
          path.cost + cost
        );
        // and push it to the next iteration
        nextPaths.push(nextPath);
      }
    }
    if (nextPaths.length == 0) {
      throw new Error('no more valid paths');
    }
    if (DEBUG) console.debug({ i, nextPaths });
    paths = nextPaths;
    if (paths.every((path) => path.done)) break;
  }
  const sortedPaths = paths.filter((path) => path.done).sort((a, b) => a.cost - b.cost);
  const lowestCost = sortedPaths[0].cost;
  console.log('part 1:', lowestCost);
  const bestPaths = sortedPaths.filter((path) => path.cost == lowestCost);
  const bestPathTiles = new Map(...bestPaths.map((path) => path.hist.entries()).flat());

  for (const bestPathTile of bestPathTiles.values()) {
    mapData[bestPathTile.value[0]][bestPathTile.value[1]] = 'O';
  }
  printMap(mapData);

  console.log('part 2:', bestPathTiles.size);
};

solve(mapData);
