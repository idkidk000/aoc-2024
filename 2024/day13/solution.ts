#!/usr/bin/env -S deno --allow-read

const DEBUG = false;
const EXAMPLE = false;

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug('text', text);

interface Machine {
  px: number;
  py: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

const machines: Machine[] = text
  .replaceAll(/((Prize|Button [AB]): )|([XY]=?)/g, '')
  .split('\n\n')
  .filter((section) => section.trim())
  .map((section) => {
    const sectionNums = section.split('\n').map((line) => line.split(' '));
    return {
      // sectionNums,
      px: parseInt(sectionNums[2][0]),
      py: parseInt(sectionNums[2][1]),
      ax: parseInt(sectionNums[0][0]),
      ay: parseInt(sectionNums[0][1]),
      bx: parseInt(sectionNums[1][0]),
      by: parseInt(sectionNums[1][1]),
    };
  });
if (DEBUG) console.debug({ machines });

const solve = (machines: Machine[], offset: number = 0) => {
  const totalCost = machines.reduce((acc, machine) => {
    const px = machine.px + offset;
    const py = machine.py + offset;
    const ax = machine.ax;
    const ay = machine.ay;
    const bx = machine.bx;
    const by = machine.by;

    // visualise as lines a and b intersecting where one starts at the origin and the other ends at the prize. solve for the multipliers
    const ma = (px * by - py * bx) / (ax * by - ay * bx);
    const mb = (px - ma * ax) / bx;

    // at least one button press and both are integers
    const valid = (ma > 0 || mb > 0) && ma % 1 == 0 && mb % 1 == 0;
    const cost = ma * 3 + mb;

    if (DEBUG) console.debug({ px, py, ax, ay, bx, by, ma, mb, valid, cost, acc });

    if (valid) acc += cost;
    return acc;
  }, 0);
  console.log({ offset, totalCost });
};

solve(machines);
solve(machines, 10000000000000);