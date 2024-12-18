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

const blocks = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split(',').map((item) => parseInt(item)));
if (DEBUG) console.debug({ blocks });

const genMap = (lenX: number, lenY: number, blocks: number[][]) => {
  const mapData = Array.from({ length: lenX }, () => Array.from({ length: lenY }).fill(false)) as boolean[][];
  for (const block of blocks) {
    mapData[block[0]][block[1]] = true;
  }
  return mapData;
};

const drawMap = (mapData: boolean[][]) => {
  const lenX = mapData[0].length;
  const lenY = mapData.length;
  for (let y = 0; y < lenY; y++) {
    const row = [`${String(y).padStart(3, ' ')}:  `];
    for (let x = 0; x < lenX; x++) {
      row.push(mapData[x][y] ? '#' : '.');
    }
    console.debug(row.join(''));
  }
};

class Coord {
  public hash;
  constructor(public x: number, public y: number) {
    this.hash = x * 1000 + y;
  }
}

class Path {
  public history: number[] = [];
  public current!: Coord;
  constructor(public start: Coord, noInit: boolean = false) {
    if (!noInit) this.push(start);
  }
  len() {
    return this.history.length - 1;
  }
  push(coord: Coord) {
    if (this.history.includes(coord.hash)) return false;
    this.history.push(coord.hash);
    this.current = coord;
    return true;
  }
  clone() {
    const newPath = new Path(this.start, true);
    newPath.history = [...this.history];
    newPath.current = this.current;
    return newPath;
  }
}

const getShortestPath = (mapData: boolean[][], startX: number, startY: number, endX: number, endY: number) => {
  const lenX = mapData[0].length;
  const lenY = mapData.length;
  const end = new Coord(endX, endY);
  let paths = [new Path(new Coord(startX, startY))];
  const shortestPaths: Map<number, number> = new Map();
  const nextPaths: Path[] = [];
  for (let i = 0; i < lenX * lenY; i++) {
    for (const path of paths) {
      for (let dir = 0; dir < 4; dir++) {
        const nextCoord = new Coord(
          path.current.x + (dir == 0 ? -1 : dir == 2 ? 1 : 0),
          path.current.y + (dir == 3 ? -1 : dir == 1 ? 1 : 0)
        );

        // oob or block
        if (nextCoord.x < 0 || nextCoord.x >= lenX || nextCoord.y < 0 || nextCoord.y >= lenY || mapData[nextCoord.x][nextCoord.y])
          continue;

        // get/set shortestPaths, continue if not shortest
        const shortestPath = shortestPaths.get(nextCoord.hash);
        if (typeof shortestPath === 'undefined') {
          shortestPaths.set(nextCoord.hash, path.len());
        } else if (shortestPath <= path.len()) {
          continue;
        }
        // TODO: don't think we need to handle shortestPath>path.len

        const nextPath = path.clone();
        // returns false if duplicate
        if (!nextPath.push(nextCoord)) continue;

        // return the completed path immediately
        if (nextCoord.hash == end.hash) {
          return nextPath.len();
        } else {
          nextPaths.push(nextPath);
        }
      }
    }
    paths = nextPaths;
  }
  // throw new Error('no path found');
  return -1;
};

const part1 = (blocks: number[][]) => {
  let lenX: number, lenY: number, blockCount: number;
  switch (FILENAME) {
    case 'input.txt':
      lenX = 71;
      lenY = 71;
      blockCount = 1024;
      break;
    case 'example.txt':
      lenX = 7;
      lenY = 7;
      blockCount = 12;
      break;
    default:
      throw new Error(`add lenX,lenY,blockCount case for filename ${FILENAME}`);
  }
  const mapData = genMap(lenX, lenY, blocks.slice(0, blockCount));
  if (DEBUG) drawMap(mapData);
  const shortestPath = getShortestPath(mapData, 0, 0, lenX - 1, lenY - 1);
  console.log('part 1', shortestPath);
};

const part2 = (blocks: number[][]) => {
  let lenX: number, lenY: number;
  switch (FILENAME) {
    case 'input.txt':
      lenX = 71;
      lenY = 71;
      break;
    case 'example.txt':
      lenX = 7;
      lenY = 7;
      break;
    default:
      throw new Error(`add lenX,lenY case for filename ${FILENAME}`);
  }
  // for (let blockCount = 1024; blockCount < blocks.length; blockCount++) {
  const mapData = genMap(lenX, lenY, blocks);
  for (let blockCount = blocks.length - 1; blockCount > -1; blockCount--) {
    const blockCoord = blocks[blockCount];
    mapData[blockCoord[0]][blockCoord[1]] = false;
    if (DEBUG) console.debug({ blockCount, blockCoord });
    if (DEBUG > 1) drawMap(mapData);
    if (getShortestPath(mapData, 0, 0, lenX - 1, lenY - 1) > -1) {
      console.log('part 2', blockCount + 1, blockCoord);
      break;
    }
  }
};

part1(blocks);
part2(blocks);
