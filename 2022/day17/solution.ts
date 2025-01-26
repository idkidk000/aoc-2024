#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    clamp(value: number, min: number, max: number): number;
    gcd(left: number, right: number): number;
    lcm(values: number[]): number;
    pmod(value: number, mod: number): number;
  }
}

Math.clamp = (value: number, min: number, max: number) => Math.max(Math.min(value, max), min);
Math.gcd = (left: number, right: number) => {
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};
Math.lcm = (values: number[]) => values.reduce((acc, item) => (acc * item) / Math.gcd(acc, item), 1);
Math.pmod = (value: number, mod: number) => {
  const result = value % mod;
  return result >= 0 ? result : result + mod;
};

const Maths = Math;

class Args {
  constructor(public filename = 'input.txt', public debug = 0, public part1 = true, public part2 = true) {
    for (const arg of Deno.args) {
      const [key, value] = [arg.slice(0, 2), (fallback = 0) => Number(arg.slice(2) || fallback)];
      if (key === '-d') debug = value(1);
      else if (key === '-e') filename = `example${arg.slice(2)}.txt`;
      else if (key === '-i') filename = 'input.txt';
      else if (key === '-p') [part1, part2] = [(value(0) & 1) === 1, (value(0) & 2) === 2];
      else throw new Error(`unrecognised arg="${arg}"`);
    }
    [this.filename, this.debug, this.part1, this.part2] = [filename, debug, part1, part2];
    console.log(`args: {filename: "${filename}", debug: ${debug}, part1: ${part1}, part2: ${part2} }`);
  }
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

interface Coord {
  x: number;
  y: number;
}
interface Rock {
  cells: Array<Coord>;
  width: number;
  height: number;
  raw: Array<string>;
}

const parseInput = () => {
  const jets = Deno.readTextFileSync(args.filename);
  const rocks = new Array<Rock>();
  for (const rawRock of Deno.readTextFileSync('rocks.txt')
    .split('\n\n')
    .map((section) =>
      section
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.split(''))
    )) {
    const rock: Rock = {
      cells: new Array<Coord>(),
      width: rawRock[0].length,
      height: rawRock.length,
      raw: rawRock.map((row) => row.join('')),
    };
    for (const [y, row] of rawRock.entries()) {
      // flip y so coords can be added
      //FIXME: this seems backwards
      for (const [x, char] of row.entries()) if (char === '#') rock.cells.push({ x, y: rawRock.length - y - 1 });
    }
    rocks.push(rock);
  }
  return { jets, rocks };
};

const simulate = (jets: string, rocks: Array<Rock>, dropCount: number, hook?: (dropNum: number, maxY: number) => boolean) => {
  const cavernWidth = 7;
  const startXOffset = 2;
  const startYOffset = 3;
  let maxY = -1; //the examples are kind of fucky
  // y=0 bottom
  // lcm of jets length, rocks length, and maxY delta cycle length still means having to drop ~17m rocks. which is ~85m occupied cells. which makes sets very sad
  const occupied = new Set<number>();
  const hashCoord = (coord: Coord) => coord.y + (coord.x << 28);
  const isOccupied = (coord: Coord) => occupied.has(hashCoord(coord));
  const setOccupied = (coord: Coord) => occupied.add(hashCoord(coord));
  /* const occupied = new Map<number, number>();
  //BUG somewhere in this bc my p1 answer is wrong
  const hashCoord = (coord: Coord) => {
    // return { key: coord.y, val: coord.x + 1 };
    const [yPack, xPack] = [6, 4];
    return { key: Maths.floor(coord.y / yPack), val: (coord.x + 1) << ((coord.y % yPack) * xPack) };
  };
  const isOccupied = (coord: Coord) => {
    const { key, val } = hashCoord(coord);
    return occupied.has(key) && (occupied.get(key)! & val) === val;
  };
  const setOccupied = (coord: Coord) => {
    const { key, val } = hashCoord(coord);
    if (!occupied.has(key)) occupied.set(key, val);
    else occupied.set(key, occupied.get(key)! | val);
  }; */
  const addCoord = (left: Coord, right: Coord, xExtra?: number, yExtra?: number) => ({
    x: left.x + right.x + (xExtra ?? 0),
    y: left.y + right.y + (yExtra ?? 0),
  });
  let jetIx = 0;
  for (let dropNum = 0; dropNum < dropCount; ++dropNum) {
    const rock = rocks.at(dropNum % rocks.length)!;
    //rock origin bottom left so position and cell can be added
    const position: Coord = { x: startXOffset, y: maxY + startYOffset + 1 };
    debug(2, { rock, position, maxY });
    // while true is always a sign of quality code
    while (true) {
      // jet
      // check that every new cell position is within x bounds and unoccupied
      const xOffset = jets.at(jetIx % jets.length)! === '<' ? -1 : 1;
      if (
        rock.cells.every((cell) => {
          const newCell = addCoord(position, cell, xOffset);
          return newCell.x >= 0 && newCell.x < cavernWidth && !isOccupied(newCell);
        })
      ) {
        position.x += xOffset;
        debug(3, 'jet', { xOffset, position });
      } else {
        debug(3, 'jet blocked', { xOffset, position });
      }

      ++jetIx;

      // drop
      // as above
      const yOffset = -1;
      if (
        rock.cells.every((cell) => {
          const newCell = addCoord(position, cell, 0, yOffset);
          return newCell.y >= 0 && !isOccupied(newCell);
        })
      ) {
        position.y += yOffset;
        debug(3, 'drop', { yOffset, position });
      } else {
        //reached the end of y travel. set all cells to occupied, update maxY, and break
        for (const cell of rock.cells) setOccupied(addCoord(position, cell));
        maxY = Maths.max(maxY, position.y + rock.height - 1);
        debug(1, 'drop blocked', { yOffset, position, rock, maxY });
        if (args.debug) {
          for (let y = maxY; y >= 0; --y) {
            let row = '';
            for (let x = 0; x < cavernWidth; ++x) row += isOccupied({ x, y }) ? '#' : '.';
            debug(1, `${y.toString().padStart(3, ' ')}: ${row}`);
          }
        }
        break;
      }
    }
    if (typeof hook !== 'undefined' && hook(dropNum, maxY)) break;
  }

  return maxY + 1;
};

const part1 = () => {
  const { jets, rocks } = parseInput();
  const result = simulate(jets, rocks, 2022);
  console.log('part 1:', result);

  // 3177
};

const part2 = () => {
  const { jets, rocks } = parseInput();
  const sillyNumber = 1_000_000_000_000;
  const lcm = Maths.lcm([jets.length, rocks.length, 1740]);
  // 17558340 rocks results in FAR too many entries for a set. i'll have to rethink storage
  console.log(lcm);
  console.log('lcmHeight', simulate(jets, rocks, lcm));
  console.log('lcm2Height', simulate(jets, rocks, lcm * 2));
  console.log('lcm3Height', simulate(jets, rocks, lcm * 3));
  console.log('lcm4Height', simulate(jets, rocks, lcm * 4));
  /*   const lcmHeight = simulate(jets, rocks, lcm);
  // BUG: these are not multiples of lcmHeight. 2 is +2, 3 is +4, 4 is +10
  // they're also not multiples of lcm2-lcm
  // so there's something i haven't considered. presumably rocks falling through holes. i assumed that would stabilise and fall into some multiple of jets.length*rocks.length
  const lcm2Height = simulate(jets, rocks, lcm * 2);
  const lcm3Height = simulate(jets, rocks, lcm * 3);
  const lcm4Height = simulate(jets, rocks, lcm * 4);
  const lcmPlus1Height = simulate(jets, rocks, lcm + 1);
  const just1Height = simulate(jets, rocks, 1);
  const lcm1Diff = lcmPlus1Height - lcmHeight - just1Height;
  const sillyModLcmHeight = simulate(jets, rocks, sillyNumber % lcm);
  console.log({ lcm, lcmHeight, lcm2Height, lcm3Height, lcm4Height, lcmPlus1Height, just1Height, lcm1Diff, sillyModLcmHeight });
  // const result = Maths.floor(sillyNumber / lcm) * (lcmHeight + lcm1Diff) + sillyModLcmHeight;
  const result = Maths.floor(sillyNumber / lcm) * (lcmHeight + lcm1Diff) + sillyModLcmHeight;

  console.log('part 2:', result); */
  // the gap thing happens frequently. need to determine a cycle length and add that to the lcm calculation. then result should be based on lcm1*1 + (lcm2-lcm1)*a lot + remainder
  // const lcmResults = new Array<number>();
  /*   let deltas = '';
  let prevMaxY = 0;
  const searchLength = 100;
  simulate(jets, rocks, lcm * 1000, (dropNum, maxY) => {
    // if (prevMaxYs.length > 0 && maxY == prevMaxYs.at(-1)!.dropNum) console.log({ dropNum, maxY });
    // prevMaxYs.push({ dropNum, maxY });
    // if ((dropNum + 1) % lcm === 0) {
    //   const lcmMultiple = (dropNum + 1) / lcm;
    //   const height = maxY + 1;
    //   lcmResults.push(height);
    //   console.log(lcmMultiple, height);
    // }
    const delta = (maxY - prevMaxY).toString();
    if (delta.length !== 1) throw new Error(delta);
    deltas += delta;
    if (dropNum > searchLength) {
      const search = deltas.slice(-searchLength);
      const index = deltas.indexOf(search);
      console.log(dropNum, search, index);
      // dropNum 1915-2014 result matches 175-274 - cycle of 1740
      if (index < dropNum - searchLength) return true;
    }
    prevMaxY = maxY;
    return false;
  }); */

  // 5132474466221 too high (i messed up coord hashing)
  // 1565394906358 too low
};

if (args.part1) part1();
if (args.part2) part2();
