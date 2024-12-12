#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
const EXAMPLE = false;

class Tuple {
  // private values: number[];
  constructor(public values: number[]) {
    // this.values = values;
    // return new Proxy(this, {
    //   // make values accessible through instance[0]
    //   get: (target, prop) => (!isNaN(Number(prop)) ? this.values[Number(prop)] : (target as any)[prop]),
    // });
  }
  hash() {
    return JSON.stringify(this.values);
  }
}

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug({ text });

const grid = text
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => line.split(''));
if (DEBUG) console.debug({ grid });
const rowCount = grid.length;
const colCount = grid[0].length;
const walked = Array.from({ length: rowCount }, () => Array(colCount).fill(false));
if (DEBUG) console.debug({ walked });

const walk = (rowIx: number, colIx: number) => {
  walked[rowIx][colIx] = true;
  let area = 1;
  let perimeter = 0;
  const edges = new Map();
  for (let direction = 0; direction < 4; direction++) {
    const testRowIx = rowIx + (direction === 0 ? -1 : direction === 2 ? 1 : 0);
    const testColIx = colIx + (direction === 3 ? -1 : direction === 1 ? 1 : 0);
    const edge = new Tuple([testRowIx, testColIx, direction]);
    if (0 <= testRowIx && testRowIx < rowCount && 0 <= testColIx && testColIx < colCount) {
      // in bounds
      if (grid[testRowIx][testColIx] !== grid[rowIx][colIx]) {
        // different area
        perimeter++;
        edges.set(edge.hash(), edge);
      } else if (!walked[testRowIx][testColIx]) {
        // same area but unwalked
        const walkNext = walk(testRowIx, testColIx);
        area += walkNext.area;
        perimeter += walkNext.perimeter;
        walkNext.edges.forEach((edgeNew) => {
          edges.set(edgeNew.hash(), edgeNew);
        });
      }
    } else {
      // out of bounds
      perimeter++;
      edges.set(edge.hash(), edge);
    }
  }
  return { area, perimeter, edges };
};

let totalCost1 = 0;
let totalCost2 = 0;
for (let rowIx = 0; rowIx < rowCount; rowIx++) {
  for (let colIx = 0; colIx < colCount; colIx++) {
    if (!walked[rowIx][colIx]) {
      const { area, perimeter, edges } = walk(rowIx, colIx);
      const cost1 = area * perimeter;
      const sides = edges.values().reduce((acc, edge) => {
        // test coord to the left for up/down edges and above for left/right edges
        const testEdge = new Tuple([
          edge.values[0] + ([1, 3].includes(edge.values[2]) ? -1 : 0),
          edge.values[1] + ([0, 2].includes(edge.values[2]) ? -1 : 0),
          edge.values[2],
        ]);
        if (!edges.has(testEdge.hash())) acc++;
        return acc;
      }, 0);
      const cost2 = area * sides;
      const charAt = grid[rowIx][colIx];
      if (DEBUG) console.debug({ charAt, rowIx, colIx, area, perimeter, edges: edges.values(), sides, cost1, cost2 });
      totalCost1 += cost1;
      totalCost2 += cost2;
    }
  }
}
console.log('part 1', totalCost1);
console.log('part 2', totalCost2);
